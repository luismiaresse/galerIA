from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader

# Create your views here.
def index(request):
    template = loader.get_template('index.html')
    context = {
        "imagenprueba": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    }
    return HttpResponse(template.render(context, request))


