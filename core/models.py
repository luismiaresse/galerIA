from django.db import models
from knox.models import User

SCHEMA = "rest"

# Album model
class Album(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    creationdate = models.DateTimeField(auto_now=True)
    lastupdate = models.DateTimeField(auto_now=True)
    
    user = models.ManyToManyField(User)       # Creates intermediate table
    
    class Meta:
        db_table = f'"{SCHEMA}"."album"'

    def __str__(self):
        return f"Album: {self.name}"

# Media (images or videos) model
class Media(models.Model):
    id = models.AutoField(primary_key=True)
    filename = models.CharField(max_length=500)
    file = models.BinaryField()
    creationdate = models.DateTimeField(auto_now=True)
    kind = models.CharField(max_length=20)    # Can be 'image', 'video' or 'profile' (for profile pictures)
    # Optional fields
    location = models.CharField(max_length=50, null=True)
    label = models.CharField(max_length=50, null=True)
    
    album = models.ManyToManyField(Album)     # Creates intermediate table 
    
    class Meta:
        db_table = f'"{SCHEMA}"."media"'

    def __str__(self):
        return f"Media: {self.label}"
    

