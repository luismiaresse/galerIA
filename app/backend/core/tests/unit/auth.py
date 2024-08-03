
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.tests import AUTH_TOKEN_PREFIX, INCORRECT_TOKEN, TESTUSER_EMAIL, TESTUSER_PASSWORD, TESTUSER_USERNAME, login_user, register_user

# TEST IDENTIFIER: UNIT-01-01
class RegisterTests(APITestCase):
    CORRECT_USERNAME = "user";
    CORRECT_EMAIL = "user@mail.com";
    CORRECT_PASSWORD = "password";

    INCORRECT_USERNAME = "us";
    INCORRECT_EMAIL = "user@mail";
    INCORRECT_PASSWORD = "pass";
    
    def setUp(self):
        self.url = reverse('register')
        
        # Register testuser
        data = {
            "username": TESTUSER_USERNAME,
            "email": TESTUSER_EMAIL,
            "password": TESTUSER_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], TESTUSER_USERNAME)
        
    # Valid test cases
    def test_register01(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "email": self.CORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], self.CORRECT_USERNAME)

    # Invalid test cases
    def test_register02(self):
        data = {
            "username": self.INCORRECT_USERNAME,
            "email": self.CORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
    def test_register03(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "email": self.INCORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
    
    def test_register04(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "email": self.CORRECT_EMAIL,
            "password": self.INCORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        
    def test_register05(self):
        data = {
            "username": TESTUSER_USERNAME,
            "email": self.CORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        
    def test_register06(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "email": TESTUSER_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    
    
# TEST IDENTIFIER: UNIT-01-04
class LoginTests(APITestCase):
    CORRECT_USERNAME = "user";
    CORRECT_EMAIL = "user@mail.com";
    CORRECT_PASSWORD = "password";

    INCORRECT_USERNAME = "usernonexistent";
    INCORRECT_EMAIL = "usernonexistent@mail.com";
    INCORRECT_PASSWORD = "passwordincorrect";
    
    def setUp(self):
        self.url = reverse('login')
        
        # Register user
        data = {
            "username": self.CORRECT_USERNAME,
            "email": self.CORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(reverse('register'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], self.CORRECT_USERNAME)
    
    # Valid test cases
    def test_login01(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)
        
    def test_login02(self):
        data = {
            "email": self.CORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)
    
    # Invalid test cases
    def test_login03(self):
        data = {
            "username": self.INCORRECT_USERNAME,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_login04(self):
        data = {
            "email": self.INCORRECT_EMAIL,
            "password": self.CORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login05(self):
        data = {
            "username": self.CORRECT_USERNAME,
            "password": self.INCORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login06(self):
        data = {
            "email": self.CORRECT_EMAIL,
            "password": self.INCORRECT_PASSWORD
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# TEST IDENTIFIER: UNIT-01-06
class LogoutTests(APITestCase):
        
    def setUp(self):
        self.url = reverse('logout')
        
        # Register user
        register_user(self)
        
        # Login user
        login_user(self)
    
    # Valid test cases
    def test_logout01(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # Invalid test cases
    def test_logout02(self):
        self.client.credentials(HTTP_AUTHORIZATION=AUTH_TOKEN_PREFIX + INCORRECT_TOKEN)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_logout03(self):
        self.client.credentials()
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    