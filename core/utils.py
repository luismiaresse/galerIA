import base64

def encode_image(file):
    return base64.b64encode(file).decode('utf-8')

def decode_image(img_from_db):
    if img_from_db is None:
        return None
    if isinstance(img_from_db, bytes):
        return img_from_db.decode('utf-8')
    if isinstance(img_from_db, memoryview):
        return img_from_db.tobytes().decode('utf-8')
    return img_from_db
