"""Request-size cap and contact-form text length limits.

- Every request body is capped at 12MB (public contact form: 10MB
  attachment + fields); the editor-only sponsor upload keeps its existing
  20MB file limit. Oversize bodies answer 413, never 500.
- Contact text fields are length-checked server-side (the frontend
  maxLength attributes are only a convenience).
"""

from __future__ import annotations

import io
from unittest.mock import MagicMock, patch

import pytest

from app import MAX_REQUEST_BYTES, create_app
from services import contact_service
from utils.auth import AuthUser
from utils.validators import (
    MAX_COMPANY_NAME_LENGTH,
    MAX_CONTACT_EMAIL_LENGTH,
    MAX_CONTACT_NAME_LENGTH,
    MAX_PHONE_LENGTH,
    ValidationError,
)

MB = 1024 * 1024


@pytest.fixture
def http():
    return create_app().test_client()


# --- request body cap -------------------------------------------------------------


def test_max_content_length_is_configured():
    assert create_app().config["MAX_CONTENT_LENGTH"] == 12 * MB
    assert MAX_REQUEST_BYTES == 12 * MB


def test_oversize_contact_post_is_413_not_500(http):
    with patch("routes.contact_routes.contact_service.create_contact") as create:
        response = http.post(
            "/api/contacts",
            data=b"x" * (12 * MB + 1),
            content_type="application/octet-stream",
        )
    assert response.status_code == 413
    body = response.get_json()
    assert body["ok"] is False
    assert body["message"]
    create.assert_not_called()


def test_contact_post_within_cap_reaches_the_route(http):
    with patch(
        "routes.contact_routes.contact_service.create_contact",
        return_value={"id": "c-1"},
    ) as create:
        response = http.post(
            "/api/contacts",
            json={"contact_name": "山田", "email": "a@example.com"},
        )
    assert response.status_code == 201
    create.assert_called_once()


def test_sponsor_upload_keeps_its_20mb_allowance(http):
    # 15MB body passes the size gate and reaches auth (401 without a token).
    response = http.post(
        "/api/sponsors/upload",
        data=b"x" * (15 * MB),
        content_type="application/octet-stream",
    )
    assert response.status_code == 401


def test_sponsor_upload_over_its_cap_is_413(http):
    response = http.post(
        "/api/sponsors/upload",
        data=b"x" * (22 * MB),
        content_type="application/octet-stream",
    )
    assert response.status_code == 413


def test_sponsor_upload_just_over_21mb_is_413(http):
    with patch("routes.sponsor_routes.require_editor") as require:
        response = http.post(
            "/api/sponsors/upload",
            data=b"x" * (21 * MB + 1),
            content_type="application/octet-stream",
        )
    assert response.status_code == 413
    require.assert_not_called()


# --- sponsor files of 12-20MB really upload (existing 20MB spec) -------------------

EDITOR = AuthUser(id="u-1", email="e@example.com", role="editor", status="active")


@pytest.fixture
def sponsor_storage():
    client = MagicMock()
    bucket = client.storage.from_.return_value
    bucket.create_signed_url.return_value = {"signedURL": "https://example.test/signed"}
    with (
        patch("routes.sponsor_routes.require_editor", return_value=(EDITOR, None)),
        patch("services.sponsor_service.get_supabase_client", return_value=client),
    ):
        yield bucket


def _pdf_of_size(size: int) -> bytes:
    return b"%PDF" + b"0" * (size - 4)


@pytest.mark.parametrize("size", [12 * MB + 1, 16 * MB, 20 * MB])
def test_sponsor_file_of_12_to_20mb_uploads(http, sponsor_storage, size):
    response = http.post(
        "/api/sponsors/upload",
        data={"file": (io.BytesIO(_pdf_of_size(size)), "deal.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    assert response.get_json()["data"]["path"].startswith("deals/")
    uploaded_bytes = sponsor_storage.upload.call_args.args[1]
    assert len(uploaded_bytes) == size


def test_sponsor_file_over_20mb_still_rejected_by_existing_rule(http, sponsor_storage):
    # Fits the 21MB request cap, but the 20MB file limit is unchanged.
    response = http.post(
        "/api/sponsors/upload",
        data={"file": (io.BytesIO(_pdf_of_size(20 * MB + 1)), "deal.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    sponsor_storage.upload.assert_not_called()


# --- contact text length limits ---------------------------------------------------

VALID = {
    "contact_name": "山田",
    "email": "user@example.com",
    "subject": "テスト",
    "message": "本文",
    "contact_type": "general",
}


@pytest.fixture
def db():
    client = MagicMock()
    client.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "c-1", **VALID}]
    )
    with (
        patch("services.contact_service.get_supabase_client", return_value=client),
        patch("services.contact_service._notify_emails"),
    ):
        yield client


def _email_of_length(length: int) -> str:
    domain = "@example.com"
    return "a" * (length - len(domain)) + domain


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("contact_name", "あ" * MAX_CONTACT_NAME_LENGTH),
        ("company_name", "会" * MAX_COMPANY_NAME_LENGTH),
        ("phone", "+" + "1" * (MAX_PHONE_LENGTH - 1)),
        ("email", _email_of_length(MAX_CONTACT_EMAIL_LENGTH)),
    ],
)
def test_contact_field_at_limit_is_accepted(db, field, value):
    contact_service.create_contact({**VALID, field: value})
    inserted = db.table.return_value.insert.call_args.args[0]
    assert inserted[field] == value


@pytest.mark.parametrize(
    ("field", "value", "label"),
    [
        ("contact_name", "あ" * (MAX_CONTACT_NAME_LENGTH + 1), "担当者名"),
        ("company_name", "会" * (MAX_COMPANY_NAME_LENGTH + 1), "会社名"),
        ("phone", "1" * (MAX_PHONE_LENGTH + 1), "電話番号"),
        ("email", _email_of_length(MAX_CONTACT_EMAIL_LENGTH + 1), "メールアドレス"),
    ],
)
def test_contact_field_over_limit_is_rejected_before_insert(db, field, value, label):
    with pytest.raises(ValidationError, match=label):
        contact_service.create_contact({**VALID, field: value})
    db.table.return_value.insert.assert_not_called()


def test_overlong_contact_name_route_is_400(http, db):
    response = http.post(
        "/api/contacts",
        json={**VALID, "contact_name": "あ" * (MAX_CONTACT_NAME_LENGTH + 1)},
    )
    assert response.status_code == 400
    assert "担当者名" in response.get_json()["message"]
