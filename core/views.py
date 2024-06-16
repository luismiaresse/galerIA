import datetime
import json
import dateutil
from django.http import HttpResponse, HttpRequest
from django.template import loader

# Template views

def index(request: HttpRequest):
    template = loader.get_template('index.html')
    response = HttpResponse(template.render(None, request))
    return response



# API views

from core import utils
from core.common import DEFAULT_ALBUM, MediaKinds
from core.models import Album, Media, UserAlbums, UserData, UserMedia
from core.serializers import UserDataSerializer, UserSerializer
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework import status, generics, permissions
from knox.views import LoginView as KnoxLoginView, LogoutView as KnoxLogoutView, APIView as KnoxAPIView
from django.contrib.auth import login
from django.contrib.auth.models import User


# Login API view
class LoginAPI(KnoxLoginView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AuthTokenSerializer
    
    def post(self, request):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super(LoginAPI, self).post(request)  

        
# Register API view
class RegisterAPI(generics.CreateAPIView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = UserSerializer
    
    def post(self, request, *args, **kwargs):
        created = self.create(request, *args, **kwargs)
        if (created):
            # Create default album and profile photo for new user
            self.create_default_album(request)
            self.create_profile_photo(request)
        return created
    
    # Create album for new users
    def create_default_album(self, request):
        user = User.objects.get(username=request.data['username'])
        defaultalbum = Album.objects.create(name=DEFAULT_ALBUM)
        defaultalbum.user.add(user)
        
    def create_profile_photo(self, request):
        user = User.objects.get(username=request.data['username'])
        profile = Media.objects.create(filename="profile.png", file=None, kind=MediaKinds.PROFILE.value)
        album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
        profile.album.add(album)
    

class UserAPI(KnoxAPIView):    
    # Get user data
    def get(self, request):
        if not request.user:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        # If request is a health check
        if request.GET.get('check'):
            return HttpResponse(status=status.HTTP_200_OK)
        
        # Fetch requesting user data
        try:
            user = UserData.objects.get(id=request.user.id)
            
            
            return HttpResponse(str(user), content_type='application/json')
        
        except UserData.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request):
        if not request.user:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return HttpResponse(serializer.data)
        return HttpResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # TODO: Remove all user data (albums, media, etc.)
    # def delete(self, request):
    #     if not request.user:
    #         return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
    #     user = User.objects.get(id=request.user.id)
    #     user.delete()
    #     return HttpResponse(status=status.HTTP_204_NO_CONTENT)
    
    def post(self, request):
        serializer = UserSerializer(data=request.POST)
        if serializer.is_valid():
            serializer.save()
            return HttpResponse(serializer.data, status=status.HTTP_201_CREATED)
        return HttpResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class AlbumAPI(KnoxAPIView):
    # Get user album data
    def get(self, request):
        if (not request.user):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        albumid = request.GET.get('id')
        if albumid == None:
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
        else:
            album = Album.objects.get(id=albumid, user=user)
        return HttpResponse(str(album), content_type='application/json')
            
    # Create user album
    def put(self, request):
        if (not request.user) or (not request.POST.get('name')):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
                
        albumname = request.POST.get('name')
        album = Album.objects.create(name=albumname)
        album.user.add(user)
        # Return new album ID
        return HttpResponse('{ "id": ' + str(album.id) + '}', content_type='application/json', status=status.HTTP_201_CREATED)
    
    
class UserAlbumsAPI(KnoxAPIView):
    # Get all user albums
    def get(self, request):
        if not request.user:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        albums = UserAlbums.objects.filter(id=user.id)
        
        # Create JSON response
        albums_json = "["
        for album in albums:
            albums_json += str(album) + ","   
        # Remove last comma
        albums_json = albums_json[:-1]
        albums_json += "]"
        
        return HttpResponse(albums_json, content_type='application/json')
    
    
    
class MediaAPI(KnoxAPIView):
    # Get user media
    def get(self, request):
        if (not request.user) or (not request.GET.get('id')) or (not request.GET.get('kind')):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        kind = request.GET.get('kind')
        albumid = request.GET.get('albumid')
        if albumid:
            album = Album.objects.get(user=user, id=albumid)
        else: 
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)

        try:
            # Fetch image
            if kind == MediaKinds.IMAGE.value:
                imageid = request.GET.get('id')
                media = Media.objects.get(id=imageid, album=album)
            
            # Fetch video
            elif kind == MediaKinds.VIDEO.value:
                videoid = request.GET.get('id')
                media = Media.objects.get(id=videoid, album=album)
            return HttpResponse(str(media), content_type='application/json')
        except Media.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        
    # Add media to user album
    def put(self, request):
        if (not request.user) or (not request.POST.get('kind')) or (not request.data['file']):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        kind = request.POST.get('kind')
        file = request.data['file']
        filename = file.name
        location = request.POST.get('location')
        label = request.POST.get('label')
        albumid = request.POST.get('albumid')
        modification = request.POST.get('modificationdate')
        if modification:
            modificationdate = dateutil.parser.isoparse(modification)
        else:
            modificationdate = datetime.datetime.now()
        
        if albumid:
            album = Album.objects.get(id=albumid, user=user)
        else:
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)

        # Profile photo upload
        if kind == MediaKinds.PROFILE.value:
            # Encode binary data to base64
            file64 = utils.encode_image(file.file.read())
            # Get current profile photo
            current = album.media_set.filter(kind=MediaKinds.PROFILE.value)
            if current:
                current.delete()
            media = Media.objects.create(filename=filename, file=file64, kind=MediaKinds.PROFILE.value, modificationdate=modificationdate)
            # Add profile picture to user profile album
            media.album.add(album)
        # Image upload
        elif kind == MediaKinds.IMAGE.value:
            # Encode binary data to base64
            file64 = utils.encode_image(file.file.read())
            media = Media.objects.create(filename=filename, file=file64, kind=MediaKinds.IMAGE.value, label=label, location=location, modificationdate=modificationdate)
            # Add image to user default album
            media.album.add(album)
        # Video upload
        elif kind == MediaKinds.VIDEO.value:
            # Encode binary data to base64
            file64 = utils.encode_image(file.file.read())
            media = Media.objects.create(filename=filename, file=file64, kind=MediaKinds.VIDEO.value, label=label, location=location, modificationdate=modificationdate)
            # Add video to user default album
            media.album.add(album)
            
        # Update album last update date
        album.save()
            
        # Return new media info without binary data
        media.file = None
        return HttpResponse(str(media), content_type='application/json', status=status.HTTP_200_OK)
    
    # Delete media from user album
    def delete(self, request):
        if (not request.user) or (not request.POST.get('id')):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)
            albumid = request.POST.get('albumid')
            if albumid:
                album = Album.objects.get(id=albumid, user=user)
            else:
                album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            mediaid = request.POST.get('id')
            media = Media.objects.get(id=mediaid, album=album)
            
            # Update album last update date
            album.save()
            
            if media:
                media.delete()
                return HttpResponse(status=status.HTTP_204_NO_CONTENT)
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)
        except Media.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    
    
class UserMediaAPI(KnoxAPIView):
    # Get all user media from an album (except profile photos)
    def get(self, request):
        if (not request.user):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        mediaid = request.GET.get('mediaid')
        skipfiles = request.GET.get('skipfiles')
                
        # If only one media is requested
        if mediaid:
            usermedia = UserMedia.objects.get(id=user.id, media_id=mediaid)
            # Get media
            media = Media.objects.get(id=mediaid, album=usermedia.album_id)
            if skipfiles:
                media.file = None
            media_json = json.loads(str(media))
            media_json["albumid"] = usermedia.album_id
            return HttpResponse(json.dumps(media_json), content_type='application/json')
        
        # If album ID is provided, get media from that album
        albumid = request.GET.get('albumid')
        if albumid:
            album = Album.objects.get(id=albumid, user=user)
        else:
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            
        # Get media from album
        media = []
        images = album.media_set.filter(kind=MediaKinds.IMAGE.value)
        # for img in images:
        #     img.file = img.file.decode('utf-8')
        media.extend(images)
        videos = album.media_set.filter(kind=MediaKinds.VIDEO.value)
        # for vid in videos:
        #     vid.file = vid.file.decode('utf-8')
        media.extend(videos)
        
        # Sort media by creation date (newest first)
        if media: 
            media.sort(key=lambda x: x.modificationdate, reverse=True)
        
        # Create JSON response
        media_json = "["
        if len(media) != 0:
            for m in media:
                if skipfiles:
                    m.file = None
                media_json += str(m) + ","
                # media_json["albumid"] = album.id
            # Remove last comma
            media_json = media_json[:-1]
        media_json += "]"
        
        return HttpResponse(media_json, content_type='application/json')
