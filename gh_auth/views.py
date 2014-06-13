from django.shortcuts import render
from django import http
from django.core.urlresolvers import reverse
from django.conf import settings

import urllib
from urlparse import parse_qs
import requests


def redirect(request):
    # Redirect user
    # GET https://github.com/login/oauth/authorize
    # client_id, redirect_uri, scope, state
    url = 'https://github.com/login/oauth/authorize'

    params = {
        'redirect_uri': "http://{0}{1}".format(settings.DOMAIN, reverse('gh_auth_callback')),
        'client_id': settings.GITHUB_API_CLIENT_ID,
        'scope': 'public_repo',
    }
    redirect_url = '{0}?{1}'.format(url, urllib.urlencode(params))
    return http.HttpResponseRedirect(redirect_url)


def callback(request):
    # Get access token
    # POST https://github.com/login/oauth/access_token
    # client_id, client_secret, code, redirect_uri
    url = 'https://github.com/login/oauth/access_token'
    code = request.GET['code']
    params = {
        'client_id': settings.GITHUB_API_CLIENT_ID, 
        'client_secret': settings.GITHUB_API_CLIENT_SECRET,
        'code': code,
        'redirect_uri': "http://{0}{1}".format(settings.DOMAIN, reverse('gh_auth_callback')),
    }
    response = requests.post(url, data=params)
    access_token = parse_qs(response.text).get('access_token')
    return http.HttpResponse(access_token)
