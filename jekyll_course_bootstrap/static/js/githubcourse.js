// Return course page at given path
function get_course_page(token, user, repository, path, callback) {
    var github = new Github({
        token: token,
        auth: 'oauth'
    });
    var repo = github.getRepo(user, repository);
    repo.contents('gh-pages', path, function(err, res){
        // TODO handle errors
        var match = res.match(/---\n([^]*?)\n---([^]*)/);
        var result = jsyaml.safeLoad(match[1]);
        result.content = match[2];
        callback(err, result);
    });
}

function create_course_page(token, user, repository, path, content, callback) {
    var github = new Github({
        token: token,
        auth: 'oauth'
    });
    var repo = github.getRepo(user, repository);
    repo.postContents('gh-pages', path, content, 'create new post ' + path, function(err, res){
        callback(err, res);
    });
}


// take an array of deferred objects and run them synchronously
function serialize( functions ){
    var runner = function(deferred, array){
        if (array.length > 0) {
            array[0].then(function(){
                serialize(array.slice(1));
            });
        } else {
            deferred.resolve();
        }
    }
    var deferred = $.Deferred();
    return deferred;
}

function copy_file(token, src_user, src_repo, src_path, dst_user, dst_repo){
    var deferred = $.Deferred();
    var github = new Github({
        token: token,
        auth: 'oauth'
    });
    var repo = github.getRepo(src_user, src_repo);
    repo.contents('gh-pages', src_path, function(err, res){
        var dstRepo = github.getRepo(dst_user, dst_repo);
        dstRepo.postContents('gh-pages', src_path, res, 'Copying ' + src_path, function(err, res){
            deferred.resolve();
        });
    });
    return deferred;
};


// Copy a repository path ex> copy_path('s', 'p2pu', '_layout', 'dirkcuys', 'howtop2pu'
function copy_path(token, src_user, src_repo, src_path, dst_user, dst_repo) {
    var deferred = $.Deferred();
    
    var github = new Github({
        token: token,
        auth: 'oauth'
    });

    var copyFile = function(path){
        return copy_file(token, src_user, src_repo, path, dst_user, dst_repo);
    };

    var copyPath = function(path) {
        return copy_path(token, src_user, src_repo, path, dst_user, dst_repo);
    };

    var copyPath = function(files){
        var dpipe = $.Deferred();
        var dnext = dpipe;
        for (var i = 0; i < files.length; ++i){
            var path = files[i].path;
            if (files[i].type == "file"){
                // bind path to stupid function
                dnext = dnext.then(copyFile.bind(null, path));
            } else if (files[i].type == "dir") {
                dnext = dnext.then(copyPath.bind(null, path));
            }
        }
        dpipe.resolve();
        return dnext;
    };

    // Get path
    var repo = github.getRepo(src_user, src_repo);
    repo.contents('gh-pages', src_path, function(err, res){
        copyPath(JSON.parse(res)).then(function(){
            deferred.resolve()
        });
    });

    // Copy path
    return deferred;
}


function create_course(token, user, repository, callback) {
    var course = {};
    var github = new Github({
        token: token,
        auth: 'oauth'
    });

    // Create repository
    var repo = github.getRepo();
    var repoOptions = {
        name: repository,
        homepage: user + '.github.io/' + repository
    }

    repo.createRepo(repoOptions, function(err, res){
        // Bootstrap course
        // files _config.yml README.markdown _posts/2000-01-01-start-here.markdown
        var repo = github.getRepo(user, repository);

        var postContent = function(path, content, comment){
            var deferred = $.Deferred();
            repo.postContents('gh-pages', path, content, comment, function(err, res){
                 deferred.resolve();
            });
            return deferred;
        };

        var templateRepo = 'jekyll-course-template';
        var templateRepoUser = 'p2pu';
        var configData = [
            'baseurl: /' + repository,
            'markdown: redcarpet'
        ].join('\n');
        var indexData = '---\nlayout: course_about\n---\n# Your first course';
        var courseData = '';

        $.when(
            postContent('_config.yml', configData, 'Add config file for jekyll course template')
        ).then(function(){
            return copy_file(token, templateRepoUser, templateRepo, 'README.markdown', user, repository);
        }).then(function(){
            return postContent('_data/course.yml', courseData, 'Add front page to course');
        }).then(function(){
            return copy_path(token, templateRepoUser, templateRepo, '_layouts', user, repository);
        }).then(function(){
            return copy_path(token, templateRepoUser, templateRepo, '_includes', user, repository);
        }).then(function(){
            return postContent('index.markdown', indexData, 'Add front page to course');
        }).then(function(){
            return copy_path(token, templateRepoUser, templateRepo, '_posts', user, repository);
        }).then(function(){
            return copy_path(token, templateRepoUser, templateRepo, 'css', user, repository);
        }).then(function(){
            return copy_path(token, templateRepoUser, templateRepo, 'js', user, repository);
        }).then(function(){
            callback(null, course);
        });
    });
}
