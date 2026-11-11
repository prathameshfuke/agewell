"""Validate user-uploaded images by content, never by filename or declared content-type."""
import io

from PIL import Image

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 40_000_000  # a 4 KB PNG can decode to gigabytes: refuse before decoding
ALLOWED_FORMATS = {'JPEG', 'PNG', 'WEBP'}


def read_image(file_storage):
    """Return (PIL image, raw bytes) or raise ValueError with a message safe to show the user."""
    data = file_storage.read(MAX_IMAGE_BYTES + 1)
    if not data:
        raise ValueError('That file is empty.')
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError('That photo is too large. Please use one under 8 MB.')
    try:
        image = Image.open(io.BytesIO(data))  # sniffs the magic bytes
        if image.format not in ALLOWED_FORMATS:
            raise ValueError
        if image.width * image.height > MAX_PIXELS:
            raise ValueError('That photo has too many pixels. Please use a smaller one.')
        image.load()  # full decode: catches truncated or corrupt files now
    except ValueError as exc:
        raise ValueError(str(exc) or 'Please upload a PNG, JPG or WEBP photo.')
    except Exception:
        raise ValueError('That file could not be read as an image.')
    return image, data
