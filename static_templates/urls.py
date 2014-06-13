from django.conf.urls import patterns, url
from django.conf import settings

urlpatterns = patterns('',
    url(r'^(?P<path>.*)$', 'static_templates.views.render_template'),
)
