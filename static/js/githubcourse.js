// Return course page at given path
function get_course_page(token, user, repository, path, callback) {
    var github = new Github({
        token: token,
        auth: 'oauth'
    });
    var repo = github.getRepo(user, repository);
    repo.contents('gh-pages', path, function(err, res){
        // TODO handle errors
        var result = {content: res};
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

function get_user_courses(token, callback) {
    // get all repositories for authenticated user
    // try to get _p2pucourse.ini file for every repository
}

function read_course(token, user, repository, callback){
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


// Copy a repository path ex> copy_path('s', 'p2pu', '_layout', 'dirkcuys', 'howtop2pu'
function copy_path(token, src_user, src_repo, src_path, dst_user, dst_repo) {
    var deferred = $.Deferred();
    
    var github = new Github({
        token: token,
        auth: 'oauth'
    });

    var copyFile = function(path){
        var cfdeferred = $.Deferred();
        var repo = github.getRepo(src_user, src_repo);
        repo.contents('gh-pages', path, function(err, res){
            var dstRepo = github.getRepo(dst_user, dst_repo);
            dstRepo.postContents('gh-pages', path, res, 'Copying ' + path, function(err, res){
                cfdeferred.resolve();
            });
        });
        return cfdeferred;
    };

    var copyPath = function(files){
        var dpipe = $.Deferred();
        var dnext = dpipe;
        for (var i = 0; i < files.length; ++i){
            if (files[i].type == "file"){
                var path = files[i].path;
                // bind path to stupid function
                dnext = dnext.then(copyFile.bind(null, path));
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

        var configData = 'baseurl: /' + repository + '\nmarkdown: redcarpet\n';
        var indexData = '---\nlayout: course_about\n---\n# Your first course';
        var courseData = '';

        $.when(
            postContent('_config.yml', configData, 'Add config file for jekyll course template')
        ).then(function(){
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
            callback(null, course);
        });
    });
}