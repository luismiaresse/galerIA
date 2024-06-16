import json
from django.db import models
from knox.models import User

from core import utils

SCHEMA = "rest"

# Album model
class Album(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    # Auto now add only sets the value of the field to now when the object is first created
    creationdate = models.DateTimeField(auto_now_add=True)
    # Auto now sets the value of the field to now every time the object is saved
    lastupdate = models.DateTimeField(auto_now=True)
    
    user = models.ManyToManyField(User)       # Creates intermediate table
    
    class Meta:
        db_table = f'"{SCHEMA}"."album"'

    def __str__(self):
        return json.dumps({
            "id": self.id,
            "name": self.name,
            "creationdate": self.creationdate.isoformat(),
            "lastupdate": self.lastupdate.isoformat()
        })

# Media (images or videos) model
class Media(models.Model):
    id = models.AutoField(primary_key=True)
    filename = models.CharField(max_length=500)
    file = models.CharField(null=True)   # Allow null for default profile photos
    modificationdate = models.DateTimeField()
    kind = models.CharField(max_length=20)    # Can be 'image', 'video' or 'profile' (for profile photos)
    # Optional fields
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
        if (self.file is not None):
            string["file"] = utils.decode_image(self.file)
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
    photo = models.CharField()
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_data_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        return json.dumps({
            "username": self.username,
            "email": self.email,
            "photo": utils.decode_image(self.photo)
        })

    
    
class UserAlbums(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    album_id = models.IntegerField()
    album_name = models.CharField(max_length=50)
    album_elements = models.IntegerField()
    creationdate = models.DateTimeField()
    lastupdate = models.DateTimeField()
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_albums_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        return json.dumps({
            "albumid": self.album_id,
            "albumname": self.album_name,
            "albumelements": self.album_elements,
            "creationdate": self.creationdate.isoformat(),
            "lastupdate": self.lastupdate.isoformat()
        })

    
class UserMedia(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    album_id = models.IntegerField()
    album_name = models.CharField(max_length=50)
    media_id = models.IntegerField()
    kind = models.CharField(max_length=20)
    file = models.CharField()
    is_cover = models.BooleanField()
    
    class Meta:
        db_table = f'"{SCHEMA}"."user_media_view"'
        # Being a view, it is read-only and should not be created, updated or deleted by Django
        managed = False
        
    def __str__(self):
        return json.dumps({
            "albumid": self.album_id,
            "album_name": self.album_name,
            "mediaid": self.media_id,
            "kind": self.kind,
            "file": self.file,
            "iscover": self.is_cover
        })
    
