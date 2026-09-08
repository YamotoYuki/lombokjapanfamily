"""Magic-byte verification for all upload paths (STEP16 security audit).

Previously only the contact-attachment path checked real file content;
gallery/post/family/avatar/settings/sponsor uploads trusted the declared
extension + Content-Type only. `verify_file_signature` is now shared and
wired into every upload path via `storage_service.read_upload_file` /
`read_settings_asset_file`, plus the two paths that bypass storage_service
(`post_service.upload_post_image`, `sponsor_service.upload_sponsor_file`).
"""

from __future__ import annotations

import pytest

from utils.validators import ValidationError, verify_file_signature

JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 32
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
GIF_BYTES = b"GIF89a" + b"\x00" * 32
WEBP_BYTES = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 32
PDF_BYTES = b"%PDF-1.4\n" + b"\x00" * 32
ZIP_BYTES = b"PK\x03\x04" + b"\x00" * 32
ICO_BYTES = b"\x00\x00\x01\x00" + b"\x00" * 32

TEXT_BYTES = b"just some plain text, not an image at all"
HTML_BYTES = b"<html><body><script>alert(1)</script></body></html>"


# ---------------------------------------------------------------------------
# Valid files: each declared extension matches its real magic bytes
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "data,extension",
    [
        (JPEG_BYTES, "jpg"),
        (JPEG_BYTES, "jpeg"),
        (PNG_BYTES, "png"),
        (GIF_BYTES, "gif"),
        (WEBP_BYTES, "webp"),
        (PDF_BYTES, "pdf"),
        (ZIP_BYTES, "zip"),
        (ZIP_BYTES, "docx"),
        (ZIP_BYTES, "xlsx"),
        (ICO_BYTES, "ico"),
    ],
)
def test_accepts_matching_signature(data: bytes, extension: str):
    verify_file_signature(data, extension)  # must not raise


# ---------------------------------------------------------------------------
# Spoofed files: extension says one thing, bytes say another
# ---------------------------------------------------------------------------


def test_rejects_text_disguised_as_jpg():
    with pytest.raises(ValidationError):
        verify_file_signature(TEXT_BYTES, "jpg")


def test_rejects_html_disguised_as_png():
    with pytest.raises(ValidationError):
        verify_file_signature(HTML_BYTES, "png")


def test_rejects_html_disguised_as_webp():
    with pytest.raises(ValidationError):
        verify_file_signature(HTML_BYTES, "webp")


def test_rejects_wrong_image_type_for_extension():
    # Real PNG bytes but declared as .jpg
    with pytest.raises(ValidationError):
        verify_file_signature(PNG_BYTES, "jpg")


def test_rejects_svg_extension_outright():
    svg_bytes = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    with pytest.raises(ValidationError):
        verify_file_signature(svg_bytes, "svg")


def test_rejects_unknown_extension():
    with pytest.raises(ValidationError):
        verify_file_signature(JPEG_BYTES, "exe")


def test_rejects_empty_file():
    with pytest.raises(ValidationError):
        verify_file_signature(b"", "png")


def test_rejects_corrupted_file():
    with pytest.raises(ValidationError):
        verify_file_signature(b"\x89PN", "png")  # truncated PNG signature


def test_rejects_non_zip_disguised_as_docx():
    with pytest.raises(ValidationError):
        verify_file_signature(HTML_BYTES, "docx")


class _FakeFileStorage:
    """Minimal stand-in for werkzeug.FileStorage used by storage_service."""

    def __init__(self, filename: str, content_type: str, data: bytes):
        self.filename = filename
        self.content_type = content_type
        self._data = data

    def read(self) -> bytes:
        return self._data


def test_storage_service_read_upload_file_rejects_spoofed_png():
    from services.storage_service import read_upload_file

    fake = _FakeFileStorage("evil.png", "image/png", HTML_BYTES)
    with pytest.raises(ValidationError):
        read_upload_file(fake)


def test_storage_service_read_upload_file_accepts_real_png():
    from services.storage_service import read_upload_file

    real = _FakeFileStorage("logo.png", "image/png", PNG_BYTES)
    file_bytes, filename, content_type = read_upload_file(real)
    assert file_bytes == PNG_BYTES
    assert filename == "logo.png"
    assert content_type == "image/png"


def test_storage_service_read_settings_asset_file_rejects_spoofed_ico():
    from services.storage_service import read_settings_asset_file

    fake = _FakeFileStorage("favicon.ico", "image/x-icon", HTML_BYTES)
    with pytest.raises(ValidationError):
        read_settings_asset_file(fake)


def test_post_upload_post_image_rejects_spoofed_content():
    from services.post_service import PostValidationError, upload_post_image

    with pytest.raises(PostValidationError):
        upload_post_image(
            file_bytes=HTML_BYTES,
            filename="cover.jpg",
            content_type="image/jpeg",
        )


def test_sponsor_upload_rejects_spoofed_docx():
    from services.sponsor_service import upload_sponsor_file

    with pytest.raises(ValidationError):
        upload_sponsor_file(
            file_bytes=HTML_BYTES,
            filename="proposal.docx",
            content_type="application/octet-stream",
        )
