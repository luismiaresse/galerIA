
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.common import ALBUM_NAME_MAX_LENGTH, DEFAULT_ALBUM, SharingPermissionKinds
from core.tests import AUTH_TOKEN_PREFIX, INCORRECT_TOKEN, OTHERUSER_EMAIL, OTHERUSER_PASSWORD, OTHERUSER_USERNAME, check_album, get_default_album, put_album, login_user, register_user

# TEST IDENTIFIER: UNIT-05-01
class PutAlbumTests(APITestCase):
    CORRECT_ALBUMNAME = "album"
    CORRECT_REPEATED_ALBUMNAME = "testalbum"
    INCORRECT_DEFAULT_ALBUMNAME = DEFAULT_ALBUM
    INCORRECT_TOO_LONG_ALBUMNAME = "a" * (ALBUM_NAME_MAX_LENGTH + 1)
    
    def setUp(self):
        self.url = reverse('album')
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add an album to test same name
        self.REPEATED_ALBUM = put_album(self, self.CORRECT_REPEATED_ALBUMNAME)
        
    # Valid test cases
    def test_putAlbum01(self):
        album = {
            "name": self.CORRECT_ALBUMNAME,
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['name'], self.CORRECT_ALBUMNAME)
        self.assertTrue('id' in data)
    
    def test_putAlbum02(self):
        album = {
            "name": self.CORRECT_REPEATED_ALBUMNAME,
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['name'], self.CORRECT_REPEATED_ALBUMNAME)
        self.assertTrue('id' in data)
        self.assertTrue(data['id'] != self.REPEATED_ALBUM['id'])
        
    # Invalid test cases
    def test_putAlbum03(self):
        album = {
            "name": self.CORRECT_ALBUMNAME,
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_putAlbum04(self):
        album = {
            "name": self.CORRECT_ALBUMNAME,
        }
        self.client.credentials()
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_putAlbum06(self):
        album = {
            "name": self.INCORRECT_DEFAULT_ALBUMNAME,
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_putAlbum07(self):
        album = {
            "name": "",
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_putAlbum08(self):
        album = {
            "name": self.INCORRECT_TOO_LONG_ALBUMNAME,
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
        
# TEST IDENTIFIER: UNIT-05-02
class GetAlbumsTests(APITestCase):
    
    def setUp(self):
        self.url = reverse('albums')
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add an album
        self.ALBUM = put_album(self, "album")
    
    # Valid test cases
    def test_getAlbums01(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(isinstance(data, list))
        self.assertTrue(len(data) > 0)
        check_album(self, data[0], self.ALBUM)
    
    # Invalid test cases
    def test_getAlbums02(self):
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_getAlbums03(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        

# TEST IDENTIFIER: UNIT-05-03
class GetAlbumTests(APITestCase):
    INCORRECT_ALBUM_ID = -1
    
    def setUp(self):
        self.url = reverse('albums')
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add an album
        self.ALBUM = put_album(self, "album")
    
    # Valid test cases
    def test_getAlbum01(self):
        album = {
            "id": self.ALBUM['id']
        }
        response = self.client.get(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        check_album(self, data[0], self.ALBUM)
    
    # Invalid test cases
    def test_getAlbum02(self):
        album = {
            "id": self.ALBUM['id']
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.get(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_getAlbum03(self):
        album = {
            "id": self.ALBUM['id']
        }
        self.client.credentials()
        response = self.client.get(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_getAlbum04(self):
        album = {
            "id": self.INCORRECT_ALBUM_ID
        }
        response = self.client.get(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        
# TEST IDENTIFIER: UNIT-05-04
class UpdateAlbumNameTests(APITestCase):
    CORRECT_ALBUMNAME = "newalbumname"
    INCORRECT_ALBUMNAME = "album"
    INCORRECT_TOO_LONG_ALBUMNAME = "a" * (ALBUM_NAME_MAX_LENGTH + 1)
    INCORRECT_DEFAULT_ALBUMNAME = DEFAULT_ALBUM
    INCORRECT_ALBUM_ID = -1
    
    def setUp(self):
        self.url = reverse('album')
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add an album
        self.ALBUM = put_album(self, self.INCORRECT_ALBUMNAME)
    
    # Valid test cases
    def test_updateAlbumName01(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.CORRECT_ALBUMNAME
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue('name' in data)
        self.assertEqual(data['name'], self.CORRECT_ALBUMNAME)
    
    # Invalid test cases
    def test_updateAlbumName02(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.CORRECT_ALBUMNAME
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_updateAlbumName03(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.CORRECT_ALBUMNAME
        }
        self.client.credentials()
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_updateAlbumName04(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.INCORRECT_ALBUMNAME
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
    def test_updateAlbumName05(self):
        album = {
            "id": self.ALBUM['id'],
            "name": ""
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)

    def test_updateAlbumName06(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.INCORRECT_DEFAULT_ALBUMNAME
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_updateAlbumName07(self):
        album = {
            "id": self.INCORRECT_ALBUM_ID,
            "name": self.CORRECT_ALBUMNAME
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_updateAlbumName08(self):
        album = {
            "id": self.ALBUM['id'],
            "name": self.INCORRECT_TOO_LONG_ALBUMNAME
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
    
     
# TEST IDENTIFIER: UNIT-05-05
class DeleteAlbumTests(APITestCase):
    INCORRECT_ALBUM_ID = -1
    
    def setUp(self):
        self.url = reverse('album')
        # Register and login otheruser
        register_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD, email=OTHERUSER_EMAIL)
        login_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD)
        
        # Add an album
        self.OTHERUSER_ALBUM = put_album(self, "otheralbum")
        check_album(self, self.OTHERUSER_ALBUM, {"name": "otheralbum"})
        
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add an album
        self.ALBUM = put_album(self, "album")
        
        # Get default album
        self.DEFAULT_ALBUM = get_default_album(self)
        
        
    
    # Valid test cases
    def test_deleteAlbum01(self):
        album = {
            "id": self.ALBUM['id']
        }
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # Invalid test cases
    def test_deleteAlbum02(self):
        album = {
            "id": self.ALBUM['id']
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_deleteAlbum03(self):
        album = {
            "id": self.ALBUM['id']
        }
        self.client.credentials()
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_deleteAlbum04(self):
        album = {
            "id": self.INCORRECT_ALBUM_ID
        }
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deleteAlbum05(self):
        album = {
            "id": self.DEFAULT_ALBUM['id']
        }
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_deleteAlbum06(self):
        album = {
            "id": self.OTHERUSER_ALBUM['id']
        }
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deleteAlbum07(self):
        album = {
            "id": None
        }
        response = self.client.delete(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# TEST IDENTIFIER: UNIT-05-07
class ShareAlbumTests(APITestCase):
    INCORRECT_ALBUM_ID = -1
    INCORRECT_PERMISSIONS = "invalid"
    
    def setUp(self):
        self.url = reverse('album')
        # Register and login otheruser
        register_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD, email=OTHERUSER_EMAIL)
        login_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD)
        
        # Add an album
        self.OTHERUSER_ALBUM = put_album(self, "otheralbum")
        
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add two albums and share one
        self.ALBUM = put_album(self, "album")
        self.ALBUM2 = put_album(self, "album2")
        album2 = {
            "id": self.ALBUM2['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get default album
        self.DEFAULT_ALBUM = get_default_album(self)
        
        
    # Valid test cases
    def test_shareAlbum01(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_shareAlbum02(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_WRITE.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_shareAlbum03(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": SharingPermissionKinds.FULL_ACCESS.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    # Invalid test cases
    def test_shareAlbum04(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_shareAlbum05(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        self.client.credentials()
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_shareAlbum06(self):
        album = {
            "id": self.DEFAULT_ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_shareAlbum07(self):
        album = {
            "id": self.OTHERUSER_ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_shareAlbum08(self):
        album = {
            "id": self.INCORRECT_ALBUM_ID,
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_shareAlbum09(self):
        album = {
            "id": self.ALBUM['id']
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)

    def test_shareAlbum10(self):
        album = {
            "id": self.ALBUM['id'],
            "permissions": self.INCORRECT_PERMISSIONS
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
    def test_shareAlbum11(self):
        album = {
            "id": self.ALBUM2['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        


# TEST IDENTIFIER: UNIT-05-08
class AcceptSharedAlbumTests(APITestCase):
    INCORRECT_ALBUM_ID = -1
    INCORRECT_CODE = "12345678"
    
    def setUp(self):
        self.url = reverse('album')
        # Register and login otheruser
        register_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD, email=OTHERUSER_EMAIL)
        login_user(self, username=OTHERUSER_USERNAME, password=OTHERUSER_PASSWORD)
        
        # Add an album and share it
        self.OTHERUSER_ALBUM = put_album(self, "otheralbum")
        album = {
            "id": self.OTHERUSER_ALBUM['id'],
            "permissions": SharingPermissionKinds.READ_ONLY.value
        }
        response = self.client.put(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue('code' in data)
        self.OTHERUSER_ALBUM['code'] = data['code']
        
        # Register and login testuser
        register_user(self)
        login_user(self)
        
        # Add two albums and share one
        self.ALBUM = put_album(self, "album")
        
        # Get default album
        self.DEFAULT_ALBUM = get_default_album(self)
        
        
    # Valid test cases
    def test_acceptSharedAlbum01(self):
        album = {
            "code": self.OTHERUSER_ALBUM['code']
        }
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Get album
        url = reverse('albums')
        album = {
            "id": self.OTHERUSER_ALBUM['id']
        }
        response = self.client.get(url, album)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        check_album(self, data[0], self.OTHERUSER_ALBUM)
        
    # Invalid test cases
    def test_acceptSharedAlbum02(self):
        album = {
            "code": self.OTHERUSER_ALBUM['code']
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_acceptSharedAlbum03(self):
        album = {
            "code": self.OTHERUSER_ALBUM['code']
        }
        self.client.credentials()
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_acceptSharedAlbum04(self):
        album = {
            "code": self.INCORRECT_CODE
        }
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_acceptSharedAlbum05(self):
        album = {}
        response = self.client.post(self.url, album)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        