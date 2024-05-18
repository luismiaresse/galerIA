"""djangovite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

from core.views import LoginView, RegisterView, index
from core.views import UserView, AlbumView

urlpatterns = [
    path('admin', admin.site.urls),
    # Al ser SPA, todas las rutas deben ser manejadas por la misma vista
    # re_path(r'^.*', index),
    path('', index),
    # Pages photos, albums, shared, create
    path('photos', index),
    path('albums', index),
    # Regex para albums/album_id
    re_path(r'^albums\/[a-zA-Z0-9]+$', index),
    path('shared', index),
    path('create', index),
    path('auth', index),
    path('login', LoginView.as_view(), name='knox_login'),
    path('register', RegisterView.as_view(), name='register'),
    path('api/user', UserView.as_view(), name='user'),
    path('api/album', AlbumView.as_view(), name='media'),
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),
    # re_path('^', include(router.urls)),
    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
