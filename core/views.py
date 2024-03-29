from django.http import HttpResponse, JsonResponse, HttpRequest
from django.shortcuts import render
from django.template import loader
import json

# Create your views here.
def index(request: HttpRequest):
    template = loader.get_template('index.html')
    # context = {
    #     "imagenprueba": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    # }
    response = HttpResponse(template.render(None, request))
    # Activate Cross Origin Isolation
    response['Cross-Origin-Opener-Policy'] = 'same-origin'
    response['Cross-Origin-Embedder-Policy'] = 'require-corp'
    # Use HSTS policy
    response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    return response


# def imprimir_texto(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             texto = data.get('texto', '')
#             response_data = {'message': f'Recibido: {texto}'}
#             return JsonResponse(response_data)
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Datos JSON inválidos'})
#     else:
#         return JsonResponse({'error': 'Se esperaba una solicitud POST'})