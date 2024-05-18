from django.http import HttpResponse, HttpRequest
from django.template import loader

# Template views

def index(request: HttpRequest):
    template = loader.get_template('index.html')
    response = HttpResponse(template.render(None, request))
    return response



# API views

from core.common import DEFAULT_ALBUM, MediaKinds
from core.models import Album, Media
from core.serializers import UserSerializer
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework import status, generics, permissions
from knox.views import LoginView as KnoxLoginView, LogoutView as KnoxLogoutView, APIView as KnoxAPIView
from django.contrib.auth import login
from django.contrib.auth.models import User


# Login API view
class LoginView(KnoxLoginView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AuthTokenSerializer
    
    def post(self, request):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super(LoginView, self).post(request)  

        
# Register API view
class RegisterView(generics.CreateAPIView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = UserSerializer
    

# User API view
class UserView(KnoxAPIView):    
    def get(self, request):
        # Fetch requesting user data
        user = User.objects.get(id=request.user.id)
        serializer = UserSerializer(user)
        user_data = serializer.data
        user_data.pop('password')
        
        return HttpResponse(str(user_data), content_type='application/json')
    
    def put(self, request):
        user = User.objects.get(id=request.user.id)
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return HttpResponse(serializer.data)
        return HttpResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        user = User.objects.get(id=request.user.id)
        user.delete()
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return HttpResponse(serializer.data, status=status.HTTP_201_CREATED)
        return HttpResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# TODO Crear API para subir y obtener imágenes
# Albums API view
class AlbumView(KnoxAPIView):
    # Get user profile picture or media by id
    def get(self, request):
        user = User.objects.get(id=request.user.id)
        kind = request.GET.get('kind')
        if kind == MediaKinds.PROFILE.value:
            print("Profile")
            # Get user default album
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            # Get user profile picture
            profile = Media.objects.get(album=album, kind=MediaKinds.PROFILE.value)
            return HttpResponse(profile.file, content_type='image/jpeg')
            
            
        else:
            media = Media.objects.get()
            
    # Create user album
    def post(self, request):
        user = User.objects.get(id=request.user.id)
        album = Album.objects.create(user=user, name=request.data['name'])
        return HttpResponse(status=status.HTTP_201_CREATED)
    
    # Add media to user album
    def put(self, request):
        user = User.objects.get(id=request.user.id)
        kind = request.data['kind']
        file = request.data['file']
        print(kind)
        print(MediaKinds.PROFILE.value)
        # Profile picture upload
        if kind == MediaKinds.PROFILE.value:
            # Get user default album
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            # Put user profile picture
            profile = Media.objects.get(album=album, kind=MediaKinds.PROFILE.value)
            profile.file = file
            profile.save()
            
            return HttpResponse(status=status.HTTP_200_OK)
        # Media upload
        # else:
        #     albumid = request.data['album']
        #     album = Album.objects.get(id=albumid)
        #     # Decode binary data from request
        #     media_binary = request.data['media']
            
        #     media = Media.objects.create(media=media_binary, kind=request.data['kind'])
        #     album.media.add(media)
        return HttpResponse(status=status.HTTP_201_CREATED)