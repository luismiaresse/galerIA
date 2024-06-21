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
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

from core.views import LoginAPI, MediaAPI, RegisterAPI, UserAlbumsAPI, UserMediaAPI, index
from core.views import UserAPI, AlbumAPI
from .common import USER_API, ALBUM_API, USER_ALBUMS_API, MEDIA_API, LOGIN_API, LOGOUT_API, REGISTER_API, USER_MEDIA_API
from knox.views import LogoutView as LogoutAPI


urlpatterns = [
    # Al ser SPA, todas las rutas deben ser manejadas por la misma vista
    # re_path(r'^.*', index),
    path('', index),
    # Pages photos, albums, shared, create
    path('photos/', index),
    re_path(r'^photos\/[0-9]+$', index),
    path('albums/', index),
    # Regex para albums/album_id o albums/album_id/media_id
    re_path(r'^albums\/[0-9]+\/$', index),
    re_path(r'^albums\/[0-9]+\/[0-9]+$', index),
    path('shared/', index),
    path('create/', index),
    path('auth/', index),
    path('settings/', index),
    # APIs
    path(LOGIN_API, LoginAPI.as_view(), name='login'),
    path(REGISTER_API, RegisterAPI.as_view(), name='register'),
    path(LOGOUT_API, LogoutAPI.as_view(), name='logout'),
    path(USER_API, UserAPI.as_view(), name='user'),
    path(ALBUM_API, AlbumAPI.as_view(), name='album'),
    path(USER_ALBUMS_API, UserAlbumsAPI.as_view(), name='albums'),
    path(MEDIA_API, MediaAPI.as_view(), name='media'),
    path(USER_MEDIA_API, UserMediaAPI.as_view(), name='user_media'),
    # Robots.txt
    path("robots.txt", TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
