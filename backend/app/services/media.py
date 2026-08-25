"""Guardado de archivos multimedia (fotos de personas)."""
import base64
import re
import uuid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
FOTOS_DIR = BASE_DIR.parent / "storage" / "fotos"
FOTOS_DIR.mkdir(parents=True, exist_ok=True)

_DATA_URL_RE = re.compile(r"^data:image/(?P<ext>[a-zA-Z0-9+.-]+);base64,(?P<data>.+)$")


def guardar_foto_base64(foto_base64: str) -> str | None:
    """Decodifica una imagen en base64 (data URL o base64 puro) y la guarda.
    Devuelve la ruta absoluta como string, o None si la entrada es vacía."""
    if not foto_base64:
        return None

    match = _DATA_URL_RE.match(foto_base64.strip())
    if match:
        ext = match.group("ext").lower().replace("jpeg", "jpg")
        raw = match.group("data")
    else:
        ext = "jpg"
        raw = foto_base64

    if ext not in {"jpg", "png", "webp"}:
        ext = "jpg"

    try:
        data = base64.b64decode(raw)
    except Exception:
        return None

    filename = f"{uuid.uuid4().hex}.{ext}"
    path = FOTOS_DIR / filename
    path.write_bytes(data)
    return str(path)