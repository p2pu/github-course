from django.shortcuts import render
import os


def render_template(request, path):
    return render(request, os.path.join('static_templates', path))
