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
}
ALLOWED_ATTACHMENT_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
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


# PostgREST's logical-operator syntax (`or=(col.op.value,col2.op.value)`) uses
# "," to separate conditions and "()" to group them; ":" is reserved for
# resource-embedding / alias syntax. If user input containing these
# characters is concatenated directly into an or_()/and_() filter string, it
# can alter the intended filter structure (e.g. inject extra conditions).
# These characters are stripped (not percent-encoded — percent-encoding
# happens at the HTTP layer and does not protect against PostgREST parsing
# the *decoded* filter string). Letters (including Japanese/Indonesian),
# digits, spaces and all other punctuation are preserved untouched.
_SEARCH_TERM_STRIP = str.maketrans("", "", ",():")
MAX_SEARCH_TERM_LENGTH = 100


def sanitize_search_term(value: Any, *, max_length: int = MAX_SEARCH_TERM_LENGTH) -> str:
    """Strip PostgREST or()/and() structural characters from free-text search input.

    Returns "" (never raises) so callers can treat an empty result as "no
    usable search term" and skip applying the filter — this keeps ordinary
    empty/whitespace-only input from ever reaching PostgREST as an error.
    """
    text = str(value or "").translate(_SEARCH_TERM_STRIP)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_length]


def verify_file_signature(data: bytes, extension: str) -> None:
    """Reject extension/declared-Content-Type spoofing via magic-byte sniff.

    `extension` should be the value already returned by one of the
    `validate_*_file` functions above (e.g. "jpg" for both .jpg/.jpeg).
    Only formats this app actually allows somewhere are recognized; any
    other extension (including "svg", which is never in an allowlist here)
    is rejected outright rather than silently accepted.
    """
    if not data:
        raise ValidationError("ファイルが空です")

    ext = (extension or "").lower()
    ok = False
    if ext in {"jpg", "jpeg"}:
        ok = data[:3] == b"\xff\xd8\xff"
    elif ext == "png":
        ok = data.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext == "gif":
        ok = data[:6] in (b"GIF87a", b"GIF89a")
    elif ext == "webp":
        ok = len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    elif ext == "pdf":
        ok = data.startswith(b"%PDF")
    elif ext in {"docx", "xlsx", "zip"}:
        # OOXML (docx/xlsx) files are themselves zip containers, so the
        # container-level signature is the strongest check available
        # without fully parsing the archive. It reliably rejects non-zip
        # content (HTML/script renamed to .docx, etc.).
        ok = data[:4] in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")
    elif ext == "ico":
        ok = data[:4] == b"\x00\x00\x01\x00"

    if not ok:
        raise ValidationError("ファイルの内容が不正です")


def build_or_filter(
    term: str,
    columns: list[str],
    *,
    operator: str = "ilike",
    wildcard: bool = True,
) -> str | None:
    """Build a PostgREST or() clause matching `term` against multiple columns.

    `term` must already be sanitized via `sanitize_search_term` — this
    function only assembles the clause, it does not re-validate the value.
    `columns` must be a fixed, developer-controlled list (never user input).
    Returns None when there is no usable term, so callers can skip calling
    `.or_()` entirely.
    """
    if not term or not columns:
        return None
    pattern = f"%{term}%" if wildcard else term
    return ",".join(f"{col}.{operator}.{pattern}" for col in columns)


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
