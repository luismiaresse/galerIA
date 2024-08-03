from rest_framework import serializers
from core.models import Media, Album, UserAlbums, UserData
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8}
        }
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
        
class MediaSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Media
        fields = '__all__'
        
class AlbumSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Album
        fields = '__all__'

class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserData
        fields = '__all__'
        
class UserAlbumsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAlbums
        fields = '__all__'
        
class UserMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = '__all__'
