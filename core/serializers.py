from rest_framework import serializers
from django.contrib.auth import authenticate
from core.models import Media, Album
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'passwordhash': {'write_only': True, 'min_length': 8}
        }
        
    def create(self, validated_data):
        print("Hola")
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


class AuthSerializer(serializers.Serializer):
    '''serializer for the user authentication object'''
    username = serializers.CharField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False
    )    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )
        
        if not user:
            msg = ('Unable to authenticate with provided credentials')
            raise serializers.ValidationError(msg, code='authentication')

        attrs['user'] = user
        return 