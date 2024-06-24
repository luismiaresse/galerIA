import base64
from django.core.files import File
import requests

def encode_image(file):
    if isinstance(file, File):
        return base64.b64encode(file.read()).decode('utf-8')
    return base64.b64encode(file).decode('utf-8')

def decode_image(img_from_db):
    if img_from_db is None:
        return None
    if isinstance(img_from_db, bytes):
        return img_from_db.decode('utf-8')
    if isinstance(img_from_db, memoryview):
        return img_from_db.tobytes().decode('utf-8')
    return img_from_db


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