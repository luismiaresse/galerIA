from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.template import loader
import json

# Create your views here.
def index(request):
    template = loader.get_template('index.html')
    context = {
        "imagenprueba": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    }
    return HttpResponse(template.render(context, request))


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