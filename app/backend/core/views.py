import datetime
import os
import dateutil
from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpRequest
from django.template import loader
from django.core.files import File
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse

# Template views
def index(request: HttpRequest):
    template = loader.get_template('index.html')
    response = HttpResponse(template.render(None, request))
    return response

# API views
from core import utils
from core.common import ALBUM_NAME_MAX_LENGTH, DEFAULT_ALBUM, MediaKinds, SharingPermissionKinds
from core.models import Album, AlbumUser, Media, MediaAlbum, UserAlbums, UserData, UserMedia
from core.serializers import UserSerializer
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework import status, generics, permissions
from knox.views import LoginView as KnoxLoginView, APIView as KnoxAPIView
from django.contrib.auth import login
from django.contrib.auth.models import User


# Login API view
@extend_schema_view(
    post=extend_schema(
        summary="Login user",
        description="Logs in the user with the provided username (or email) and password.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "User's account username",
                    },
                    "email": {
                        "type": "string",
                        "description": "User's account email",
                    },
                    "password": {
                        "type": "string",
                        "description": "User's account password",
                    },
                },
                "required": ["username", "password"]
            }
        },
        responses={
            200: OpenApiResponse(description="User logged in successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing or user does not exist."),
            401: OpenApiResponse(description="Unauthorized if the login fails."),
        }
    )
)
class LoginAPI(KnoxLoginView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AuthTokenSerializer
    
    def post(self, request):
        username = request.data['username'] if 'username' in request.data else None
        email = request.data['email'] if 'email' in request.data else None
        password = request.data['password'] if 'password' in request.data else None
        if ((not username) or (not password)) and ((not email) or (not password)):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(username=username)
                
            if not user.check_password(password):
                return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
            
            login(request, user)
            return super(LoginAPI, self).post(request)  
        except User.DoesNotExist:
            # Do not reveal if user does not exist
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
# Register API view
@extend_schema_view(
    post=extend_schema(
        summary="Register new user",
        description="Registers a new user with the provided username, email and password.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "User's username",
                    },
                    "email": {
                        "type": "string",
                        "description": "User's email",
                    },
                    "password": {
                        "type": "string",
                        "description": "User's password",
                    },
                },
                "required": ["username", "email", "password"]
            }
        },
        responses={
            201: OpenApiResponse(description="User registered successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            409: OpenApiResponse(description="User already exists."),
        }
    )
)
class RegisterAPI(generics.CreateAPIView):
    # No permissions required
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = UserSerializer
    
    def post(self, request):
        username = request.data['username'] if 'username' in request.data else None
        email = request.data['email'] if 'email' in request.data else None
        password = request.data['password'] if 'password' in request.data else None
        if (not username) or (not email) or (not password):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        if not utils.check_username(username):
            return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
        
        if not utils.check_email(email):
            return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)

        if not utils.check_password(password):
            return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
        
        try:
            created = self.create(request)
            if (created):
                # Create user folder and default album for new user
                self.create_user_folder(request)
                self.create_default_album(request)
            else:
                return HttpResponse(status=status.HTTP_409_CONFLICT)
            return created
        except:
            return HttpResponse(status=status.HTTP_409_CONFLICT)
        
    def create_user_folder(self, request):
        user = User.objects.get(username=request.data['username'])
        if not os.path.exists(f"{settings.MEDIA_ROOT}/{user.username}"):
            os.mkdir(f"{settings.MEDIA_ROOT}/{user.username}")
        
    # Create album for new users
    def create_default_album(self, request):
        user = User.objects.get(username=request.data['username'])
        defaultalbum = Album.objects.create(name=DEFAULT_ALBUM)
        AlbumUser.objects.create(album=defaultalbum, user=user, is_owner=True)

    


@extend_schema_view(
    get=extend_schema(
        summary="Get user data",
        description="Fetches data for the requesting user or performs a health check.",
        parameters=[
            OpenApiParameter(name='check', description='Health check parameter', required=False, type=bool)
        ],
        responses={
            200: OpenApiResponse(response=str, description="User data retrieved successfully."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="User data not found."),
        }
    ),
    post=extend_schema(
        summary="Change password",
        description="Changes the password of the requesting user.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "passwordold": {
                        "type": "string",
                        "description": "User's actual password",
                        
                    },
                    "passwordnew": {
                        "type": "string",
                        "description": "New password to set",
                        
                    },
                },
                "required": ["passwordold", "passwordnew"]
            }
        },
        responses={
            200: OpenApiResponse(description="Password changed successfully."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            406: OpenApiResponse(description="Not acceptable if the old password is incorrect."),
        }
    ),
    delete=extend_schema(
        summary="Delete user",
        description="Deletes the requesting user and all associated albums and media.",
        responses={
            204: OpenApiResponse(description="User and associated data deleted successfully."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
        }
    )
)
class UserAPI(KnoxAPIView):    
    # Get user data
    def get(self, request):
        # If request is a health check
        if request.GET.get('check'):
            return HttpResponse(status=status.HTTP_200_OK)
        
        # Fetch requesting user data
        try:
            user = UserData.objects.get(id=request.user.id)
            return HttpResponse(str(user), content_type='application/json', status=status.HTTP_200_OK)
        
        except UserData.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        
    # Change password
    def post(self, request):
        passwordOld = request.data['passwordold'] if 'passwordold' in request.data else None
        passwordNew = request.data['passwordnew'] if 'passwordnew' in request.data else None
        if (not passwordOld) or (not passwordNew):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        if passwordOld == passwordNew:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.get(id=request.user.id)
        # Check if old password is correct
        if not user.check_password(passwordOld):
            return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
        
        user.set_password(passwordNew)
        user.save()
        return HttpResponse(status=status.HTTP_200_OK)
    
    def delete(self, request):
        user = User.objects.get(id=request.user.id)
        # Get user albums
        albums = Album.objects.filter(user=user)
        for album in albums:
            # Delete media
            media = album.media_set.all()
            for m in media:
                m.delete()
            album.delete()
    
        user.delete()
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)
    

@extend_schema_view(
    get=extend_schema(
        summary="Get user album metadata",
        description="Fetches album metadata for the requesting user.",
        parameters=[
            OpenApiParameter(name='id', description='Album ID', required=False, type=int),
        ],
        responses={
            200: OpenApiResponse(response=str, description="Album metadata retrieved successfully."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Album metadata not found."),
        }
    ),
    post=extend_schema(
        summary="Changes album cover or accepts shared album",
        description="Changes album name or accepts shared album from sharing code.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "Album ID",
                    },
                    "mediaid": {
                        "type": "integer",
                        "description": "Media ID for new album cover",
                    },
                    "code": {
                        "type": "string",
                        "description": "Sharing code",
                    },
                },
                "required": ["id"]
            }
        },
        responses={
            200: OpenApiResponse(response=str, description="Album cover changed or shared album accepted successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            403: OpenApiResponse(description="Forbidden if the user does not have full access to the album."),
            404: OpenApiResponse(description="Album not found."),
            406: OpenApiResponse(description="Not acceptable if the album is already shared."),
            409: OpenApiResponse(description="Conflict if more than one shared album is found."),
        }
    ),
    put=extend_schema(
        summary="Creates album, updates existing album's name or shares album",
        description="Creates a new album, updates an existing album's name or shares an album with other users.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "Album ID. Required for updating album metadata.",
                    },
                    "name": {
                        "type": "string",
                        "description": "Album name. Required for creating a new album or updating an existing album's name.",
                    },
                    "permissions": {
                        "type": "string",
                        "description": "Sharing permissions ('" + SharingPermissionKinds.READ_ONLY.value + "', '" + 
                        SharingPermissionKinds.READ_WRITE.value + "' or '" + SharingPermissionKinds.FULL_ACCESS.value + "'). Required for sharing an album.",
                    },
                },
            }
        },
        responses={
            200: OpenApiResponse(response=str, description="Album updated or shared successfully."),
            201: OpenApiResponse(response=str, description="Album created successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            403: OpenApiResponse(description="Forbidden if the default album is being modified, an album with same name is being created, or user does not have full access."),
            404: OpenApiResponse(description="Album not found."),
            406: OpenApiResponse(description="Not acceptable if the album name is too long or share is not requested."),
            409: OpenApiResponse(description="Conflict if the album is already shared with the same permissions."),
        }
    ),
    delete=extend_schema(
        summary="Delete album",
        description="Deletes album and all associated media.",
        parameters=[
            OpenApiParameter(name='id', description='Album ID', required=True, type=int),
        ],
        responses={
            204: OpenApiResponse(description="Album deleted successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            403: OpenApiResponse(description="Forbidden if the default album is being deleted."),
            404: OpenApiResponse(description="Album not found."),
        }
    )
)
class AlbumAPI(KnoxAPIView):
    # Get user album data
    def get(self, request):
        user = User.objects.get(id=request.user.id)
        albumid = request.GET.get('id')
        if albumid == None:
            album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
        else:
            album = Album.objects.get(id=albumid, user=user)
        return HttpResponse(str(album), content_type='application/json')
    
    def post(self, request):
        # Change album cover or check sharing code
        code = request.data['code'] if 'code' in request.data else None
        albumid = request.data['id'] if 'id' in request.data else None
        mediaid = request.data['mediaid'] if 'mediaid' in request.data else None
        if (((not albumid) or (not mediaid)) and (not code)):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)
            
            # If sharing code is provided, try to accept shared album
            if code:
                sharedalbum = Album.objects.get(code=code)
                albumuser = AlbumUser.objects.get(album=sharedalbum)
                if sharedalbum and albumuser.user != user:
                    AlbumUser.objects.create(user=user, album=sharedalbum)
                    album = UserAlbums.objects.get(id=user.id, album_id=sharedalbum.id)
                    return HttpResponse(str(album), content_type='application/json', status=status.HTTP_201_CREATED)
                else:
                    return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
            
            album = Album.objects.get(id=albumid, user=user)
            albumuser = AlbumUser.objects.get(album=album, user=user)
            media = Media.objects.get(id=mediaid)
            
            # Update album cover if user has full access
            if album.permissions == SharingPermissionKinds.FULL_ACCESS or albumuser.is_owner:
                cover = album.mediaalbum_set.get(media=media)
                cover.is_cover = True
                cover.save()
            else:
                return HttpResponse(status=status.HTTP_403_FORBIDDEN)
            
            # Remove cover from other media
            other = album.mediaalbum_set.filter(is_cover=True).exclude(media=media)
            for o in other:
                o.is_cover = False
                o.save()
            
            # Update album last update date
            album.save()
            return HttpResponse(status=status.HTTP_200_OK)
        except Album.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        except AlbumUser.MultipleObjectsReturned | Album.MultipleObjectsReturned:
            return HttpResponse(status=status.HTTP_409_CONFLICT)
            
    # Create album or share, or update user album name 
    def put(self, request):
        albumname = request.data['name'] if 'name' in request.data else None
        albumid = request.data['id'] if 'id' in request.data else None
        permissions = request.data['permissions'] if 'permissions' in request.data else None
        if ((not albumname) and (not albumid)):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)
            
            if albumname == DEFAULT_ALBUM:
                return HttpResponse(status=status.HTTP_403_FORBIDDEN)
            
            if albumname and len(albumname) > ALBUM_NAME_MAX_LENGTH:
                return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
            
            # If album ID is provided, update album metadata or share album
            if albumid:
                album = Album.objects.get(id=albumid, user=user)
                if album.name == DEFAULT_ALBUM:
                    return HttpResponse(status=status.HTTP_403_FORBIDDEN)
                # Update album name
                elif albumname and album.name != albumname:
                    album.name = albumname
                    album.save()
                    return HttpResponse(str(album), content_type='application/json', status=status.HTTP_200_OK)
                # Share album
                if permissions and permissions in [SharingPermissionKinds.READ_ONLY.value, SharingPermissionKinds.READ_WRITE.value, 
                                                   SharingPermissionKinds.FULL_ACCESS.value]:
                    # Check if album is already shared
                    if album.permissions and permissions and album.permissions == permissions:
                        return HttpResponse(status=status.HTTP_409_CONFLICT)
                    code = utils.generate_sharing_code()
                    album.permissions = permissions
                    album.code = code
                    album.save()
                    return HttpResponse(str(album), content_type='application/json', status=status.HTTP_200_OK)
                else:
                    # If name unchanged or share not requested
                    return HttpResponse(status=status.HTTP_406_NOT_ACCEPTABLE)
            
            album = Album.objects.create(name=albumname)
            AlbumUser.objects.create(user=user, album=album, is_owner=True)
            # Return new album ID
            return HttpResponse(str(album), content_type='application/json', status=status.HTTP_201_CREATED)
        except Album.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        
        
    def delete(self, request):
        albumid = request.data['id'] if 'id' in request.data else None
        if (not albumid):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)
            album = Album.objects.get(id=albumid, user=user)
            if album.name == DEFAULT_ALBUM:
                return HttpResponse(status=status.HTTP_403_FORBIDDEN)
            
            media = album.media_set.all()
            for m in media:
                m.delete()
            album.delete()
            return HttpResponse(status=status.HTTP_204_NO_CONTENT)
        except Album.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    

@extend_schema_view(
    get=extend_schema(
        summary="Get user albums",
        description="Fetches all albums for the requesting user.",
        parameters=[
            OpenApiParameter(name='id', description='Album ID', required=False, type=int),
            OpenApiParameter(name='name', description='Album name', required=False, type=str),
            OpenApiParameter(name='skipcover', description='Skip response with cover image if it is not used', required=False, type=bool),
            OpenApiParameter(name='shared', description='Fetch shared albums from other users', required=False, type=bool),
            OpenApiParameter(name='sharedowned', description='Fetch shared albums owned by the user', required=False, type=bool)
        ],
        responses={
            200: OpenApiResponse(response=str, description="Albums retrieved successfully."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Albums not found."),
        }
    )
)
class UserAlbumsAPI(KnoxAPIView):
    # Get user albums or shared with user albums
    def get(self, request):
        try:
            user = User.objects.get(id=request.user.id)
            if request.GET.get('shared'):
                albums = UserAlbums.objects.filter(id=user.id, is_owner=False)
            elif request.GET.get('sharedowned'):
                albums = UserAlbums.objects.filter(id=user.id, is_owner=True, permissions__isnull=False)
            else:
                albums = UserAlbums.objects.filter(id=user.id, is_owner=True)
            skipCover = request.GET.get('skipcover')
            albumid = request.GET.get('id')
            albumname = request.GET.get('name')
            
            if albumid:
                album = UserAlbums.objects.get(id=user.id, album_id=albumid)
                if skipCover:
                    album.cover = None
                return HttpResponse("[" + str(album) + "]", content_type='application/json')
            elif albumname:
                album = UserAlbums.objects.get(id=user.id, album_name=albumname)
                if skipCover:
                    album.cover = None
                return HttpResponse("[" + str(album) + "]", content_type='application/json')
            # Create JSON response
            albums_json = "["
            if len(albums) != 0:
                for album in albums:
                    if skipCover:
                        album.cover = None
                    albums_json += str(album) + ","   
                # Remove last comma
                albums_json = albums_json[:-1]
            albums_json += "]"     
            return HttpResponse(albums_json, content_type='application/json')
        except UserAlbums.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    
@extend_schema_view(
    put=extend_schema(
        summary="Add or update media",
        description="Adds new media to the requesting user's album or updates existing media.",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "kind": {
                        "type": "string",
                        "description": "Media kind ('" + MediaKinds.PROFILE.value + "', '" + MediaKinds.IMAGE.value + "' or '" + MediaKinds.VIDEO.value + "')",
                    },
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "Media file. Can be a file or a string in base64 format. If not provided, adds media to another album.",
                    },
                    "coordinates": {
                        "type": "string",
                        "description": "Media coordinates",
                    },
                    "label": {
                        "type": "string",
                        "description": "Media label",
                    },
                    "modificationdate": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Media modification date",
                    },
                    "detectedobjects": {
                        "type": "string",
                        "description": "Detected objects in image",
                    },
                    "albumid": {
                        "type": "integer",
                        "description": "Album ID to add media to",
                    },
                },
                "required": ["kind"]
            }
        },
        responses={
            200: OpenApiResponse(response=str, description="Media updated successfully."),
            201: OpenApiResponse(response=str, description="Media created successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Media not found."),
        }
    ),
    delete=extend_schema(
        summary="Delete media",
        description="Deletes media from the requesting user's album. If not specified, deletes media from the default album.",
        parameters=[
            OpenApiParameter(name='id', description='Media ID', required=True, type=int),
            OpenApiParameter(name='albumid', description='Album ID. If not provided, deletes from default album.', required=False, type=int),
        ],
        responses={
            204: OpenApiResponse(description="Media deleted successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Album not found."),
        }
    )
)
class MediaAPI(KnoxAPIView):
    # Add or update media to user album
    def put(self, request):
        kind = request.data['kind'] if 'kind' in request.data else None
        file = request.FILES.get('file') if 'file' in request.FILES else None
        if file and file.name is not None and file.name == "blob": filename = "Generated image.png" 
        elif file: filename = file.name
        else: filename = "Uploaded image.png"
        mediaid = request.data['id'] if 'id' in request.data else None
        albumid = request.data['albumid'] if 'albumid' in request.data else None
        label = request.data['label'] if 'label' in request.data else None
        modification = request.data['modificationdate'] if 'modificationdate' in request.data else None
        detectedobjects = request.data['detectedobjects'] if 'detectedobjects' in request.data else None
        coordinates = request.data['coordinates'] if 'coordinates' in request.data else None
        
        if (not kind):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)

            if coordinates:
                # Fetch location from coordinates
                lat, lon = coordinates.split(',')
                location = utils.get_location_from_coordinates(lat, lon)
            else: location = None
            
            if modification:
                modificationdate = dateutil.parser.isoparse(modification)
            else:
                modificationdate = datetime.datetime.now().astimezone()
                            
            # Copy media to another album
            if mediaid and not file:
                media = Media.objects.get(id=mediaid)
                album = Album.objects.get(id=albumid, user=user)
                mediacopy = Media.objects.create(filename=media.filename, kind=media.kind, label=media.label, coordinates=media.coordinates, location=media.location, modificationdate=media.modificationdate, detectedobjects=media.detectedobjects)
                mediacopy.album.add(album)
                utils.create_update_media_file(user.username, mediacopy.id, media.id)
                mediacopy.save()
                return HttpResponse(str(mediacopy), content_type='application/json', status=status.HTTP_200_OK)
            # Update media
            elif mediaid and file:
                media = Media.objects.get(id=mediaid)
                if location:
                    media.location = location
                if label:
                    media.label = label
                if detectedobjects:
                    media.detectedobjects = detectedobjects
                media.modificationdate = datetime.datetime.now().astimezone()
                utils.create_update_media_file(user.username, media.id, file)
                media.save()
                return HttpResponse(str(media), content_type='application/json', status=status.HTTP_200_OK)
            
            if not file:
                return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
                
            if albumid:
                album = Album.objects.get(id=albumid, user=user)
            else:
                album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            
            # Profile photo upload
            if kind == MediaKinds.PROFILE.value:
                # Get current profile photo
                current = album.media_set.filter(kind=MediaKinds.PROFILE.value)
                if current and current.count() == 1:
                    utils.delete_media_file(user.username, current[0].id)
                    current.delete()
                media = Media.objects.create(filename=filename, kind=MediaKinds.PROFILE.value, modificationdate=modificationdate)
                # Add profile picture to user profile album
                media.album.add(album)
            # Image upload
            elif kind == MediaKinds.IMAGE.value:
                media = Media.objects.create(filename=filename, kind=MediaKinds.IMAGE.value, label=label, coordinates=coordinates, location=location, modificationdate=modificationdate, detectedobjects=detectedobjects)
                # Check if there are any images in the album
                other = album.media_set.filter(kind=MediaKinds.IMAGE.value)
                # If no images, set this image as album cover
                if not other: is_cover = True
                else: is_cover = False
                # Add image to user default album
                MediaAlbum.objects.create(media=media, album=album, is_cover=is_cover)
            # Video upload
            elif kind == MediaKinds.VIDEO.value:
                media = Media.objects.create(filename=filename, kind=MediaKinds.VIDEO.value, label=label, coordinates=coordinates, location=location, modificationdate=modificationdate, detectedobjects=detectedobjects)
                # Add video to user default album
                media.album.add(album)
                
            # Save media file
            utils.create_update_media_file(user.username, media.id, file)
                
            # Update album last update date
            album.save()
                
            return HttpResponse(str(media), content_type='application/json', status=status.HTTP_201_CREATED)
        except Album.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        except Media.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(e)
            return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # Delete media from user album
    def delete(self, request):
        mediaid = request.data['id'] if 'id' in request.data else None
        albumid = request.data['albumid'] if 'albumid' in request.data else None
        if (not mediaid):
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=request.user.id)
            if albumid:
                album = Album.objects.get(id=albumid, user=user)
            else:
                album = Album.objects.get(user=user, name=DEFAULT_ALBUM)
            media = Media.objects.get(id=mediaid, album=album)
            
            if media and album:
                # Delete media file
                utils.delete_media_file(user.username, media.id)
                media.delete()
                # Update album last update date
                album.save()
                return HttpResponse(status=status.HTTP_204_NO_CONTENT)
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)
        except Media.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        except Album.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
    

@extend_schema_view(
    get=extend_schema(
        summary="Get user media",
        description="Fetches media for the requesting user from the specified album.",
        parameters=[
            OpenApiParameter(name='mediaid', description='Media ID', required=False, type=int),
            OpenApiParameter(name='albumid', description='Album ID', required=False, type=int),
            OpenApiParameter(name='skipfiles', description='Skip response with media files if they are not used', required=False, type=bool),
        ],
        responses={
            200: OpenApiResponse(response=str, description="Media retrieved successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Media not found."),
        }
    )
)
class UserMediaAPI(KnoxAPIView):
    # Get all user media from an album (except profile photos)
    def get(self, request):
        try:
            user = User.objects.get(id=request.user.id)
            mediaid = request.GET.get('mediaid')
            albumid = request.GET.get('albumid')
            usermedia = UserMedia.objects.filter(id=user.id)
            
            # If album ID is provided, get media from that album
            if albumid:
                usermedia = UserMedia.objects.filter(id=user.id, album_id=albumid)
                if usermedia.count() == 0:
                    return HttpResponse(status=status.HTTP_404_NOT_FOUND)
            elif albumid and not mediaid:
                usermedia = UserMedia.objects.filter(id=user.id, album_name=DEFAULT_ALBUM)
                if usermedia.count() == 0:
                    return HttpResponse(status=status.HTTP_404_NOT_FOUND)
                
            # If only one media is requested
            if mediaid and albumid:
                usermedia = usermedia.get(media_id=mediaid)
                return HttpResponse("[" + str(usermedia) + "]", content_type='application/json')
            # If no album ID is provided, get media directly from default album
            elif mediaid:
                usermedia = UserMedia.objects.get(id=user.id, media_id=mediaid)
                return HttpResponse("[" + str(usermedia) + "]", content_type='application/json')
            
            media = list(usermedia)
            
            # Sort media by creation date (newest first)
            if media: 
                media.sort(key=lambda x: x.modificationdate, reverse=True)
            
            # Create JSON response
            media_json = "["
            if len(media) != 0:
                for m in media:
                    media_json += str(m) + ","
                    # media_json["albumid"] = album.id
                # Remove last comma
                media_json = media_json[:-1]
            media_json += "]"
            return HttpResponse(media_json, content_type='application/json')
        except UserMedia.DoesNotExist:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        

@extend_schema_view(
    get=extend_schema(
        summary="Get media file",
        description="Fetches media file for the requesting user.",
        parameters=[
            OpenApiParameter(name='mediaid', description='Media ID', required=True, type=int),
            OpenApiParameter(name='kind', description=f"Media kind. Can be '{MediaKinds.IMAGE}', '{MediaKinds.PROFILE}' or '{MediaKinds.VIDEO}'", required=True, type=str),
        ],
        responses={
            200: OpenApiResponse(response=File, description="Media file retrieved successfully."),
            400: OpenApiResponse(description="Bad request if required data is missing."),
            401: OpenApiResponse(description="Unauthorized if the user is not authenticated."),
            404: OpenApiResponse(description="Media not found."),
        }
    )
)
class FileAPI(KnoxAPIView):
    def get(self, request):
        mediaid = request.GET.get('mediaid')
        kind = request.GET.get('kind')
        if not mediaid:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if not kind:
                # Get kind from DB
                media = Media.objects.get(id=mediaid)
                kind = media.kind
            file = utils.get_media_file(request.user.username, mediaid)
            return FileResponse(file, content_type='video/*' if kind == MediaKinds.VIDEO.value else 'image/*')
        except:
            return HttpResponse(status=status.HTTP_404_NOT_FOUND)
        