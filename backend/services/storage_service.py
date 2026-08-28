from __future__ import annotations

from typing import Any

from services.supabase_service import get_supabase_client
from utils.validators import ValidationError, validate_image_file, validate_settings_asset_file


def upload_public_image(
    *,
    bucket: str,
    object_path: str,
    file_bytes: bytes,
    content_type: str,
    upsert: bool = False,
) -> dict[str, str]:
    """
    Upload an image to a public Supabase Storage bucket and return its public URL.
    """
    client = get_supabase_client()
    client.storage.from_(bucket).upload(
        object_path,
        file_bytes,
        {"content-type": content_type, "upsert": "true" if upsert else "false"},
    )
    public_url = client.storage.from_(bucket).get_public_url(object_path)
    return {"path": object_path, "url": public_url}


def read_upload_file(file_storage: Any) -> tuple[bytes, str, str]:
    if file_storage is None or not getattr(file_storage, "filename", None):
        raise ValidationError("画像を選択してください")

    filename = str(file_storage.filename)
    content_type = str(getattr(file_storage, "content_type", "") or "")
    file_bytes = file_storage.read()
    validate_image_file(filename, content_type, len(file_bytes))
    return file_bytes, filename, content_type


def read_settings_asset_file(file_storage: Any) -> tuple[bytes, str, str]:
    if file_storage is None or not getattr(file_storage, "filename", None):
        raise ValidationError("画像を選択してください")

    filename = str(file_storage.filename)
    content_type = str(getattr(file_storage, "content_type", "") or "")
    file_bytes = file_storage.read()
    validate_settings_asset_file(filename, content_type, len(file_bytes))
    return file_bytes, filename, content_type
