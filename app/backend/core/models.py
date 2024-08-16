import json
from django.db import models
from knox.models import User

from core import utils
from core.common import ALBUM_NAME_MAX_LENGTH

SCHEMA = "public"

# Album model
class Album(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=ALBUM_NAME_MAX_LENGTH)
    # Auto now add only sets the value of the field to now when the object is first created
    creationdate = models.DateTimeField(auto_now_add=True)
    # Auto now sets the value of the field to now every time the object is saved
    lastupdate = models.DateTimeField(auto_now=True)
    # Sharing attributes (null if not shared)
    code = models.CharField(max_length=8, unique=True, null=True)
    permissions = models.CharField(max_length=15, null=True)

    user = models.ManyToManyField(User, through='AlbumUser')       # Creates intermediate table
    
    class Meta:
        db_table = f'"{SCHEMA}"."album"'

    def __str__(self):
        return json.dumps({
            "id": self.id,
            "name": self.name,
            "creationdate": self.creationdate.isoformat(),
            "lastupdate": self.lastupdate.isoformat(),
            "code": self.code,
            "permissions": self.permissions
        })
        

# Intermediate table for Album and User
class AlbumUser(models.Model):
    id = models.AutoField(primary_key=True)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Boolean field to indicate if the user is the owner of the album
    # Used for sharing permissions
    is_owner = models.BooleanField(default=False)
    
    class Meta:
        db_table = f'"{SCHEMA}"."album_user"'

    def __str__(self):
        return json.dumps({
            "albumid": self.album,
            "userid": self.user,
            "isowner": self.is_owner
        })
        
        

# Media (images or videos) model
class Media(models.Model):
    id = models.AutoField(primary_key=True)
    filename = models.CharField(max_length=500)
    modificationdate = models.DateTimeField()
    kind = models.CharField(max_length=20)    # Can be 'image', 'video' or 'profile' (for profile photos)
    # Optional fields
    coordinates = models.CharField(max_length=50, null=True)
    location = models.CharField(max_length=50, null=True)
    label = models.CharField(max_length=50, null=True)
    # Objects detected in the media using YOLO with format object1;object2;object3...
    detectedobjects = models.CharField(null=True, max_length=100)
    
    album = models.ManyToManyField(Album, through='MediaAlbum')     # Uses class defined below
    
    class Meta:
        db_table = f'"{SCHEMA}"."media"'

    def __str__(self):
        string = {
            "id": self.id,
            "filename": self.filename,
            "modificationdate": self.modificationdate.isoformat(),
            "kind": self.kind,
            "location": self.location,
            "label": self.label,
            "detectedobjects": self.detectedobjects
        }
        return json.dumps(string)
    
# Intermediate table for Media and Album
class MediaAlbum(models.Model):
    id = models.AutoField(primary_key=True)
    media = models.ForeignKey(Media, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    # Boolean field to indicate if the media is the cover of the album
    is_cover = models.BooleanField(default=False)
    
    class Meta:
        db_table = f'"{SCHEMA}"."media_album"'

    def __str__(self):
        return json.dumps({
            "mediaid": self.media,
            "albumid": self.album,
            "iscover": self.is_cover
        })
    
    
# VIEWS
# Users data view
class UserData(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    email = models.CharField(max_length=50)
    photoid = models.IntegerField(null=True)
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_data_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        string = {
            "username": self.username,
            "email": self.email,
        }
        if self.photoid:
            string["photoid"] = self.photoid
        return json.dumps(string)

    
    
class UserAlbums(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    album_id = models.IntegerField()
    album_name = models.CharField(max_length=ALBUM_NAME_MAX_LENGTH)
    album_elements = models.IntegerField()
    creationdate = models.DateTimeField()
    lastupdate = models.DateTimeField()
    cover = models.IntegerField(null=True)
    is_owner = models.BooleanField()
    permissions = models.CharField(max_length=15, null=True)
    code = models.CharField(max_length=8, null=True)
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_albums_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        string = {
            "id": self.album_id,
            "name": self.album_name,
            "elements": self.album_elements,
            "creationdate": self.creationdate.isoformat(),
            "lastupdate": self.lastupdate.isoformat(),
            "cover": self.cover
        }
        return json.dumps(string)

    
class UserMedia(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    album_id = models.IntegerField()
    album_name = models.CharField(max_length=ALBUM_NAME_MAX_LENGTH)
    media_id = models.IntegerField()
    is_cover = models.BooleanField()
    filename = models.CharField(max_length=500)
    kind = models.CharField(max_length=20)
    modificationdate = models.DateTimeField()
    coordinates = models.CharField(max_length=50, null=True)
    location = models.CharField(max_length=50, null=True)
    label = models.CharField(max_length=50, null=True)
    detectedobjects = models.CharField(null=True, max_length=100)
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_media_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        string = {
            "id": self.media_id,
            "albumid": self.album_id,
            "albumname": self.album_name,
            "iscover": self.is_cover,
            "filename": self.filename,
            "kind": self.kind,
            "modificationdate": self.modificationdate.isoformat(),
            "coordinates": self.coordinates,
            "location": self.location,
            "label": self.label,
            "detectedobjects": self.detectedobjects
        }
        return json.dumps(string)
    
