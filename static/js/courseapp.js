$(function(){

    var Page = Backbone.Model.extend({
        sync: function(method, model, options){
            var token = model.get('github_token');
            var user = model.get('github_user');
            var repo = model.get('github_repo');
            if (method == 'read') {
                get_course_page(token, user, repo, model.get('path'), function(err, res){
                    model.set({content: res});
                    options.success(model);
                });
            }
            else if (method == 'update') {
            }
            else if (method == 'create') {
                create_course_page(token, user, repo, model.get('path'), model.get('content'), function(err, res){
                    options.success(model);
                });
            }
            else if (method == 'delete') {
            }
        }
    });

    var PageCollection = Backbone.Collection.extend({
        model: Page
    });

    var Course = Backbone.Model.extend({
        initialize: function() {
            this.pages = new PageCollection;
        },
        sync: function(method, model, options){
            var that = this;
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
                        that.pages.add(page);
                    }
                });

                repo.contents('gh-pages', '_config.yml', function(err, res){
                    options.success(model);
                });

            } else if (method == 'create') {
                create_course(
                    model.get('github_token'),
                    model.get('github_user'),
                    model.get('github_repo'),
                    function(err, res){
                        options.success(model);
                    }
                );
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
            this.listenTo(this.model, 'all', this.render);
            this.listenTo(this.model.pages, 'add', this.addPage);
            this.listenTo(this.model.pages, 'reset', this.addAll);
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
            this.model.pages.each(this.addPage, this);
        },
        createOnEnter: function(e) {
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;
            var path = "_posts/2000-01-" + (1+this.model.pages.length) + "-" + this.input.val().toLowerCase().replace(/ /g, "-") + ".md";
            var content = "---\ntitle: \"" + this.input.val() + "\"\ncategories: [content]\n---\n";
            this.model.pages.create({
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
