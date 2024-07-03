
import enum

# Enum with media types
class MediaKinds(enum.Enum):
    IMAGE = 'image'
    VIDEO = 'video'
    PROFILE = 'profile'

# Enum with sharing permissions
class SharingPermissionKinds(enum.Enum):
    READ_ONLY = 'read-only'
    READ_WRITE = 'read-write'
    FULL_ACCESS = 'full-access'

# Constants
DEFAULT_ALBUM = 'default'
ALBUM_NAME_MAX_LENGTH = 35

# API paths
LOGIN_API = 'api/login'
LOGOUT_API = 'api/logout'
REGISTER_API = 'api/register'

USER_API = 'api/user'
ALBUM_API = 'api/album'
USER_ALBUMS_API = 'api/albums'
MEDIA_API = 'api/media'
USER_MEDIA_API = 'api/medias'
