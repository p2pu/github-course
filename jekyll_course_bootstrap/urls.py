from django.conf.urls import patterns, include, url
from django.views.generic.base import RedirectView
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'jekyll_course_bootstrap.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^$', RedirectView.as_view(pattern_name='static_templates'), {'path':'index.html'}),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^serv/', include('static_templates.urls')),
    url(r'^ghauth/', include('gh_auth.urls')),
)
