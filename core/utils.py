import base64

def encode_image(file):
    return base64.b64encode(file)

def decode_image(img_from_db):
    if img_from_db is None:
        return None
    if not isinstance(img_from_db, bytes):
        return img_from_db
    return img_from_db.decode('utf-8')
