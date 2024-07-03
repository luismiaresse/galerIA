
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.common import MediaKinds
from core.tests import AUTH_TOKEN_PREFIX, INCORRECT_TOKEN, TEST_IMAGE_FILE, TESTUSER_EMAIL, TESTUSER_PASSWORD, TESTUSER_USERNAME, login_user, register_user

# TEST IDENTIFIER: UNIT-04-01
class GetUserTests(APITestCase):
    
    def setUp(self):
        self.url = reverse('user')
        # Register and login testuser
        register_user(self)
        login_user(self)
        
    # Valid test cases
    def test_getAccountData01(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue('username' in data)
        self.assertEqual(data['username'], TESTUSER_USERNAME)
        self.assertTrue('email' in data)
        self.assertEqual(data['email'], TESTUSER_EMAIL)
        self.assertTrue('photo' in data)
   
    # Invalid test cases
    def test_getAccountData02(self):
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_getAccountData03(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        

# TEST IDENTIFIER: UNIT-04-03
class ChangePasswordTests(APITestCase):
    CORRECT_PASSWORD_OLD = TESTUSER_PASSWORD
    INCORRECT_PASSWORD_OLD = "passwordincorrect"
    CORRECT_PASSWORD_NEW = "newpassword"
    INCORRECT_PASSWORD_NEW = CORRECT_PASSWORD_OLD   # Repeated password
    
    def setUp(self):
        self.url = reverse('user')
        # Register and login testuser
        register_user(self)
        login_user(self)
    
    # Valid test cases
    def test_changePassword01(self):
        data = {
            "passwordold": self.CORRECT_PASSWORD_OLD,
            "passwordnew": self.CORRECT_PASSWORD_NEW
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    # Invalid test cases
    def test_changePassword02(self):
        data = {
            "passwordold": self.INCORRECT_PASSWORD_OLD,
            "passwordnew": self.CORRECT_PASSWORD_NEW
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
    def test_changePassword03(self):
        data = {
            "passwordold": self.CORRECT_PASSWORD_OLD,
            "passwordnew": ""
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_changePassword04(self):
        data = {
            "passwordold": self.CORRECT_PASSWORD_OLD,
            "passwordnew": self.INCORRECT_PASSWORD_NEW
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_changePassword05(self):
        data = {
            "passwordold": self.CORRECT_PASSWORD_OLD,
            "passwordnew": self.CORRECT_PASSWORD_NEW
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_changePassword06(self):
        data = {
            "passwordold": self.CORRECT_PASSWORD_OLD,
            "passwordnew": self.CORRECT_PASSWORD_NEW
        }
        self.client.credentials()
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        
# TEST IDENTIFIER: UNIT-04-04
class ChangeProfilePhotoTests(APITestCase):
    CORRECT_PROFILE_PHOTO = TEST_IMAGE_FILE
    INCORRECT_PROFILE_PHOTO = "invalidimage"
    
    def setUp(self):
        self.url = reverse('media')
        # Register and login testuser
        register_user(self)
        login_user(self)
    
    # Valid test cases
    def test_putProfilePhoto01(self):
        data = {
            "kind": MediaKinds.PROFILE.value,
            "file": self.CORRECT_PROFILE_PHOTO
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue('id' in data)
        
    # Invalid test cases
    def test_putProfilePhoto02(self):
        data = {
            "kind": MediaKinds.PROFILE.value,
            "file": self.CORRECT_PROFILE_PHOTO
        }
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_putProfilePhoto03(self):
        data = {
            "kind": MediaKinds.PROFILE.value,
            "file": self.CORRECT_PROFILE_PHOTO
        }
        self.client.credentials()
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_putProfilePhoto04(self):
        data = {
            "kind": MediaKinds.PROFILE.value,
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_putProfilePhoto05(self):
        data = {
            "kind": MediaKinds.PROFILE.value,
            # Invalid image data
            "file": self.INCORRECT_PROFILE_PHOTO
        }
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        

# TEST IDENTIFIER: UNIT-04-05
class DeleteUserTests(APITestCase):
    
    def setUp(self):
        self.url = reverse('user')
        # Register and login testuser
        register_user(self)
        login_user(self)
    
    # Valid test cases
    def test_deleteAccount01(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # Invalid test cases
    def test_deleteAccount02(self):
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_deleteAccount03(self):
        self.client.credentials()
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
