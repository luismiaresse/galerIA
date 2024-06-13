
import enum

# Enum with media types
class MediaKinds(enum.Enum):
    IMAGE = 'image'
    VIDEO = 'video'
    PROFILE = 'profile'


# Constants
DEFAULT_ALBUM = 'default'

# API paths
USER_API = 'api/user'
ALBUM_API = 'api/album'
USER_ALBUMS_API = 'api/albums'
MEDIA_API = 'api/media'
USER_MEDIA_API = 'api/medias'
LOGIN_API = 'api/login'
LOGOUT_API = 'api/logout'
REGISTER_API = 'api/register'
