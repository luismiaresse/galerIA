import base64
import binascii
import io
from django.core.files import File
import requests
import re
from PIL import Image

from core.common import MediaKinds

def validate_base64_image(base64img: str):
    try:
        image = base64.b64decode(base64img)
        img = Image.open(io.BytesIO(image))
        return True
    except:
        return False


def encode_file(file, kind: MediaKinds):
    if isinstance(file, File):
        return base64.b64encode(file.read()).decode('utf-8')
    if isinstance(file, str):
        return validate_and_clean_base64_header(file, kind == MediaKinds.IMAGE.value or kind == MediaKinds.PROFILE.value)
    return base64.b64encode(file).decode('utf-8')

def decode_file(file):
    if file is None:
        return None
    if isinstance(file, bytes):
        return file.decode('utf-8')
    if isinstance(file, memoryview):
        return file.tobytes().decode('utf-8')
    return file

# Removes data header
def validate_and_clean_base64_header(file, validate=True):
    if isinstance(file, str):
        fileparts = file.split(',')
        if len(fileparts) > 1:
            file = fileparts[1]
        
    if validate:
        valid = validate_base64_image(file)
        if not valid:
            return None
    return file


# Gets location metadata from coordinates
def get_location_from_coordinates(lat: float, lon: float) -> str:
    location_address = None
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    headers = {
        'User-Agent': 'PostmanRuntime/7.39.0',
    }
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        address = data.get('address', {})
        if 'city' in address and 'country' in address:
            location_address = f"{address['city']}, {address['country']}"
        elif 'county' in address and 'country' in address:
            location_address = f"{address['county']}, {address['country']}"
        elif 'state' in address and 'country' in address:
            location_address = f"{address['state']}, {address['country']}"
        elif 'country' in address:
            location_address = address['country']
    else:
        location_address = None
    
    return location_address

# Generates a random code for sharing
def generate_sharing_code():
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def check_username(username: str):
    if not isinstance(username, str):
        return False
    # Check with regex
    usernameRegex = r"^[a-zA-Z][a-zA-Z0-9._-]{3,19}$"
    if not re.match(usernameRegex, username):
        return False
    return True

def check_email(email: str):
    if not isinstance(email, str):
        return False
    # Check with regex
    emailRegex = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
    if not re.match(emailRegex, email):
        return False
    
    return True

def check_password(password: str):
    if not isinstance(password, str) or len(password) < 8:
        return False
    return True