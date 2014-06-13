from django.conf.urls import patterns, url
from django.conf import settings

urlpatterns = patterns('',
    url(r'^redirect/$', 'gh_auth.views.redirect', name='gh_auth_redirect'),
    url(r'^callback/$', 'gh_auth.views.callback', name='gh_auth_callback'),
)
