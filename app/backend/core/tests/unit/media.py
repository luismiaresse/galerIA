
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.common import MediaKinds
from core.tests import AUTH_TOKEN_PREFIX, INCORRECT_TOKEN, TEST_IMAGE_FILE, TEST_VIDEO_FILE, check_media, setup_users_albums_media

# TEST IDENTIFIER: UNIT-06-01
class PutMediaTests(APITestCase):
    CORRECT_IMAGE_FILE = TEST_IMAGE_FILE
    CORRECT_IMAGE_KIND = MediaKinds.IMAGE.value
    CORRECT_VIDEO_FILE = TEST_VIDEO_FILE
    CORRECT_VIDEO_KIND = MediaKinds.VIDEO.value
    INCORRECT_ALBUM_ID = -1
    
    def setUp(self):
        self.url = reverse('media')
        setup_users_albums_media(self)
        
    # Valid test cases
    def test_putMedia01(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue('id' in data)
        self.assertTrue('kind' in data)
        self.assertEqual(data['kind'], self.CORRECT_IMAGE_KIND)
        
    def test_putMedia02(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue('id' in data)
        self.assertTrue('kind' in data)
        self.assertEqual(data['kind'], self.CORRECT_IMAGE_KIND)
        
    def test_putMedia03(self):
        data = {
            "kind": self.CORRECT_VIDEO_KIND,
            "file": self.CORRECT_VIDEO_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue('id' in data)
        self.assertTrue('kind' in data)
        self.assertEqual(data['kind'], self.CORRECT_VIDEO_KIND)
        
    # Invalid test cases
    def test_putMedia04(self):
        data = {
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_putMedia05(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_putMedia06(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        self.client.credentials()
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_putMedia07(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "albumid": self.CORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_putMedia08(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.INCORRECT_ALBUM_ID
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_putMedia09(self):
        data = {
            "kind": self.CORRECT_IMAGE_KIND,
            "file": self.CORRECT_IMAGE_FILE,
            "albumid": self.INCORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_putMedia10(self):
        data = {
            "file": self.CORRECT_VIDEO_FILE,
            "albumid": self.CORRECT_ALBUM['id']
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    

# TEST IDENTIFIER: UNIT-06-03
class GetMediaTests(APITestCase):
    CORRECT_IMAGE_FILE = TEST_IMAGE_FILE
    INCORRECT_MEDIA_ID = -1
    INCORRECT_ALBUM_ID = -1
        
    
    def setUp(self):
        setup_users_albums_media(self)
        self.url = reverse('medias')  # Need to use view
        
    # Valid test cases
    def test_getMedia01(self):
        media = {
            "mediaid": self.CORRECT_MEDIA['id'],
            "albumid": self.CORRECT_ALBUM['id'],
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        for media in data:
            check_media(self, media)
            
    def test_getMedia02(self):
        media = {
            "mediaid": self.CORRECT_MEDIA['id'],
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        for media in data:
            check_media(self, media)
            
    def test_getMedia03(self):
        media = {
            "albumid": self.CORRECT_ALBUM['id'],
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        for media in data:
            check_media(self, media)
            
    # Invalid test cases
    def test_getMedia04(self):
        media = {
            "mediaid": self.CORRECT_MEDIA['id'],
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_getMedia05(self):
        media = {
            "mediaid": self.CORRECT_MEDIA['id'],
        }
        self.client.credentials()
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_getMedia06(self):
        media = {
            "mediaid": self.INCORRECT_MEDIA_ID,
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_getMedia07(self):
        media = {
            "mediaid": self.INCORRECT_MEDIA['id'],
            "albumid": self.INCORRECT_ALBUM['id'],
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_getMedia08(self):
        media = {
            "albumid": self.INCORRECT_ALBUM['id'],
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_getMedia09(self):
        media = {
            "mediaid": self.CORRECT_MEDIA['id'],
            "albumid": self.INCORRECT_ALBUM_ID
        }
        response = self.client.get(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    


# TEST IDENTIFIER: UNIT-06-07
class DeleteMediaTests(APITestCase):
    INCORRECT_MEDIA_ID = -1
    INCORRECT_ALBUM_ID = -1
        
    
    def setUp(self):
        setup_users_albums_media(self)
        self.url = reverse('media')
        
    # Valid test cases
    def test_deleteMedia01(self):
        media = {
            "id": self.CORRECT_MEDIA['id'],
            "albumid": self.CORRECT_ALBUM['id'],
        }
        response = self.client.delete(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # Invalid test cases
    def test_deleteMedia02(self):
        media = {
            "id": self.CORRECT_MEDIA['id'],
            "albumid": self.CORRECT_ALBUM['id'],
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.delete(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_deleteMedia03(self):
        media = {
            "id": self.CORRECT_MEDIA['id'],
            "albumid": self.CORRECT_ALBUM['id'],
        }
        self.client.credentials()
        response = self.client.delete(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_deleteMedia04(self):
        media = {
            "id": self.INCORRECT_MEDIA_ID,
            "albumid": self.CORRECT_ALBUM['id'],
        }
        response = self.client.delete(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_deleteMedia05(self):
        media = {
            "id": self.INCORRECT_MEDIA['id'],
            "albumid": self.INCORRECT_ALBUM['id'],
        }
        response = self.client.delete(self.url, media)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    