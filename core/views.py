from django.http import HttpResponse, HttpRequest
from django.template import loader
import json

# Create your views here.
def index(request: HttpRequest):
    template = loader.get_template('index.html')
    response = HttpResponse(template.render(None, request))
    return response
