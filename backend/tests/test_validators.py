from __future__ import annotations

import pytest

from utils.validators import ValidationError, validate_settings_asset_file


def test_reject_exe_upload():
    with pytest.raises(ValidationError):
        validate_settings_asset_file("malware.exe", "application/octet-stream", 100)


def test_reject_svg_settings_asset():
    with pytest.raises(ValidationError):
        validate_settings_asset_file("evil.svg", "image/svg+xml", 100)


def test_accept_png_upload():
    ext = validate_settings_asset_file("logo.png", "image/png", 1024)
    assert ext == "png"
