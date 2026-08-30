from __future__ import annotations

import re
from typing import Any

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

ALLOWED_CONTACT_TYPES = {"general", "sponsor", "collaboration", "media", "other"}
ALLOWED_CONTACT_STATUSES = {"new", "in_progress", "completed", "archived"}
ALLOWED_PRIORITIES = {"low", "normal", "high", "urgent"}

ALLOWED_ATTACHMENT_EXTENSIONS = {
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "doc",
    "docx",
    "xlsx",
    "zip",
}
ALLOWED_ATTACHMENT_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
}
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

ALLOWED_SETTINGS_ASSET_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "ico"}
ALLOWED_SETTINGS_ASSET_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/ico",
}


class ValidationError(ValueError):
    pass


def parse_positive_int(
    value: Any,
    *,
    default: int,
    minimum: int = 1,
    maximum: int | None = None,
    label: str = "値",
) -> int:
    """Parse page/limit query args without raising bare ValueError → 500."""
    if value is None or value == "":
        parsed = default
    else:
        try:
            parsed = int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{label}は整数で指定してください") from exc
    if parsed < minimum:
        raise ValidationError(f"{label}は{minimum}以上で指定してください")
    if maximum is not None and parsed > maximum:
        parsed = maximum
    return parsed


def require_non_empty(value: Any, message: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValidationError(message)
    return text


def validate_email(value: Any) -> str:
    email = require_non_empty(value, "メールアドレスを入力してください")
    if not EMAIL_RE.match(email):
        raise ValidationError("メールアドレスの形式が正しくありません")
    return email


def validate_subject(value: Any) -> str:
    subject = require_non_empty(value, "件名を入力してください")
    if len(subject) > 100:
        raise ValidationError("件名は100文字以内で入力してください")
    return subject


def validate_message(value: Any) -> str:
    message = require_non_empty(value, "内容を入力してください")
    if len(message) > 2000:
        raise ValidationError("内容は2000文字以内で入力してください")
    return message


def validate_contact_type(value: Any) -> str:
    contact_type = (value or "general").strip()
    if contact_type not in ALLOWED_CONTACT_TYPES:
        raise ValidationError("問い合わせ種別が不正です")
    return contact_type


def validate_status(value: Any) -> str:
    status = (value or "").strip()
    if status not in ALLOWED_CONTACT_STATUSES:
        raise ValidationError("ステータスが不正です")
    return status


def validate_priority(value: Any) -> str:
    priority = (value or "").strip()
    if priority not in ALLOWED_PRIORITIES:
        raise ValidationError("優先度が不正です")
    return priority


def validate_attachment(filename: str, content_type: str, size: int) -> str:
    if size > MAX_ATTACHMENT_BYTES:
        raise ValidationError("添付ファイルのサイズが大きすぎます")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_ATTACHMENT_EXTENSIONS:
        raise ValidationError("対応していないファイル形式です")

    if content_type and content_type not in ALLOWED_ATTACHMENT_MIME:
        # Some browsers send octet-stream; allow when extension is valid
        if content_type not in {"application/octet-stream", ""}:
            raise ValidationError("対応していないファイル形式です")

    return extension


def validate_image_file(filename: str, content_type: str, size: int) -> str:
    if size <= 0:
        raise ValidationError("画像を選択してください")
    if size > MAX_IMAGE_BYTES:
        raise ValidationError("画像サイズが大きすぎます")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("対応していないファイル形式です")

    if content_type and content_type not in ALLOWED_IMAGE_MIME:
        if content_type not in {"application/octet-stream", ""}:
            raise ValidationError("対応していないファイル形式です")

    return "jpg" if extension == "jpeg" else extension


def validate_settings_asset_file(filename: str, content_type: str, size: int) -> str:
    if size <= 0:
        raise ValidationError("画像を選択してください")
    if size > MAX_IMAGE_BYTES:
        raise ValidationError("画像サイズが大きすぎます")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_SETTINGS_ASSET_EXTENSIONS:
        raise ValidationError("対応していないファイル形式です")

    if content_type and content_type not in ALLOWED_SETTINGS_ASSET_MIME:
        if content_type not in {"application/octet-stream", ""}:
            raise ValidationError("対応していないファイル形式です")

    return "jpg" if extension == "jpeg" else extension
