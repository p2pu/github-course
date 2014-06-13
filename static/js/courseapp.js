$(function(){

    var Page = Backbone.Model.extend({
        sync: function(method, model, options){
            if (method == 'read') {
                var github = new Github({
                    token: model.get('github_token'),
                    auth: 'oauth'
                });
                var repo = github.getRepo(model.get('github_user'), model.get('github_repo'));
                repo.contents('gh-pages', model.get('path'), function(err, res){
                    model.set({content: res});
                    options.success(model);
                });
            }
            else if (method == 'update') {
            }
            else if (method == 'create') {
                var github = new Github({
                    token: model.get('github_token'),
                    auth: 'oauth'
                });
                var repo = github.getRepo(model.get('github_user'), model.get('github_repo'))
                repo.postContents('gh-pages', model.get('path'), model.get('content'), 'Create new post ' + model.get('path'), function(err, res){
                    options.success(model);
                });
            }
            else if (method == 'delete') {
            }
        }
    });

    var PageCollection = Backbone.Collection.extend({
        model: Page/*,
        sync: function(method, model, options){
            if (method == 'read') {
                var github = new Github({
                    token: model.get('github_token'),
                    auth: 'oauth'
                });
                var repo = github.getRepo(model.get('github_user'), model.get('github_repo'));
                repo.contents('gh-pages', '_posts', function(err, res){
                    var results = [];
                    var data = JSON.parse(res);
                    for (var i = 0; i < data.length; ++i){
                        page = new Page({path: data[i].path, github_user: model.get('github_user'), github_repo: model.get('github_repo')});
                        page.fetch();
                        results.push(page);
                    }
                    options.success(results);
                });
            }
        }*/
    });

    var Pages = new PageCollection;

    var Course = Backbone.Model.extend({
        sync: function(method, model, options){
            if (method == 'read') {
                var github = new Github({
                    token: model.get('github_token'),
                    auth: 'oauth'
                });
                var repo = github.getRepo(model.get('github_user'), model.get('github_repo'));
                repo.contents('gh-pages', '_posts', function(err, res){
                    var data = JSON.parse(res);
                    for (var i = 0; i < data.length; ++i){
                        page = new Page({path: data[i].path, github_user: model.get('github_user'), github_repo: model.get('github_repo')});
                        page.fetch();
                        Pages.add(page);
                    }
                });

                repo.contents('gh-pages', '_config.yml', function(err, res){
                    options.success(model);
                });

            } else if (method == 'create') {
                var github = new Github({
                    token: model.get('github_token'),
                    auth: 'oauth'
                });
                // Create repository
                var repo = github.getRepo();
                var repoOptions = {
                    name: model.get('github_repo'),
                    homepage: model.get('github_user') + '.github.io/' + model.get('github_repo')
                }
                repo.createRepo(repoOptions, function(err, res){
                    // Bootstrap course
                    // files _config.yml README.markdown _posts/2000-01-01-start-here.markdown

                    var repo = github.getRepo(model.get('github_user'), model.get('github_repo'));
                    var config = "base_url: /" + model.get('github_repo');
                    var message = 'Add config file for jekyll course template';
                    repo.postContents('gh-pages', '_config.yml', config, message, function(err, res){
                        repo.postContents('gh-pages', 'index.markdown', '---\n---\n# Your first course', 'Add front page to course', function(err, res){
                            repo.postContents('gh-pages', '_posts/2000-01-01-start-here.markdown', '---\ntitle: Start here\n---\n', 'Add post to course', function(err, res){
                                options.success(model);
                            });
                        });
                    });
                });
            }
        }
    });

    var PageView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#id-page-template').html()),
        events: {
            "click a.delete": "clear"
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        clear: function() {
            this.model.destroy();
        }
    });

    var CourseView = Backbone.View.extend({
        el: $("#id-course-view"),
        template: _.template($('#id-course-header-template').html()),
        events: {
            "keypress #id-input-page": "createOnEnter",
            "click a.load": "loadCourse",
            "click a.create": "createCourse"
        },
        initialize: function() {
            this.repoNameInput = this.$("#id-input-repo");
            this.input = this.$("#id-input-page");
            this.listenTo(Pages, 'add', this.addPage);
            this.listenTo(Pages, 'reset', this.addAll);
            this.listenTo(this.model, 'all', this.render);
        },
        render: function() {
            this.$("#id-course-header").html(this.template(this.model.toJSON()));
            return this;
        },
        addPage: function(page) {
            var view = new PageView({model: page});
            this.$("#id-page-list").append(view.render().el);
        },
        addAll: function() {
            Pages.each(this.addPage, this);
        },
        createOnEnter: function(e) {
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;
            var path = "_posts/2000-01-" + (1+Pages.length) + "-" + this.input.val().toLowerCase().replace(/ /g, "-") + ".md";
            var content = "---\ntitle: \"" + this.input.val() + "\"\n---\n";
            Pages.create({
                path: path, 
                content: content, 
                github_user: this.model.get('github_user'), 
                github_repo: this.model.get('github_repo'),
                github_token: this.model.get('github_token')
            });
            this.input.val('');
        },
        loadCourse: function() {
            if (!this.repoNameInput.val()) return;
            this.model.set('github_repo', this.repoNameInput.val());
            this.model.fetch();
        },
        createCourse: function() {
            if (!this.repoNameInput.val()) return;
            this.model.set('github_repo', this.repoNameInput.val());
            this.model.save();
        }
    });

    window.Course = Course;
    window.CourseView = CourseView;

});
