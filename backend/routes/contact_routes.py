from __future__ import annotations

from flask import Blueprint, request

from services import contact_service
from services.contact_service import ContactNotFoundError
from services.supabase_service import SupabaseConfigError
from utils.auth import require_editor
from utils.response import error, success
from utils.validators import ValidationError, parse_positive_int

contacts_bp = Blueprint("contacts", __name__)


@contacts_bp.post("/api/contacts")
def create_contact():
    # Public endpoint — Cloudflare Turnstile when TURNSTILE_SECRET_KEY is set
    try:
        from services.turnstile_service import verify_turnstile_token

        json_body = request.get_json(silent=True) or {}
        turnstile_token = request.form.get("cf_turnstile_response") or json_body.get(
            "cf_turnstile_response"
        )
        remote_ip = request.headers.get("CF-Connecting-IP") or request.remote_addr
        verify_turnstile_token(turnstile_token, remote_ip=remote_ip)

        payload = {
            "company_name": request.form.get("company_name")
            or json_body.get("company_name"),
            "contact_name": request.form.get("contact_name")
            or json_body.get("contact_name"),
            "email": request.form.get("email") or json_body.get("email"),
            "phone": request.form.get("phone") or json_body.get("phone"),
            "subject": request.form.get("subject") or json_body.get("subject"),
            "message": request.form.get("message") or json_body.get("message"),
            "contact_type": request.form.get("contact_type")
            or json_body.get("contact_type")
            or "general",
        }
        attachment = request.files.get("attachment")
        contact = contact_service.create_contact(
            payload,
            attachment_file=attachment,
        )
        return success(
            contact,
            message="お問い合わせを送信しました。",
            status=201,
        )
    except ValidationError as exc:
        return error(str(exc), status=400)
    except SupabaseConfigError as exc:
        return error(str(exc), status=500)
    except Exception as exc:
        return error(
            "お問い合わせの送信に失敗しました",
            status=500,
            details=str(exc),
        )


@contacts_bp.get("/api/contacts/stats")
def contact_stats():
    _, err = require_editor()
    if err:
        return err
    try:
        return success(contact_service.get_contact_stats())
    except Exception as exc:
        return error(
            "お問い合わせ一覧の取得に失敗しました",
            status=500,
            details=str(exc),
        )


@contacts_bp.get("/api/contacts")
def list_contacts():
    _, err = require_editor()
    if err:
        return err
    try:
        data = contact_service.list_contacts(
            keyword=request.args.get("keyword"),
            status=request.args.get("status"),
            contact_type=request.args.get("contact_type"),
            priority=request.args.get("priority"),
            page=parse_positive_int(request.args.get("page"), default=1, label="page"),
            limit=parse_positive_int(
                request.args.get("limit"), default=20, maximum=100, label="limit"
            ),
        )
        return success(data)
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error(
            "お問い合わせ一覧の取得に失敗しました",
            status=500,
            details=str(exc),
        )


@contacts_bp.get("/api/contacts/<contact_id>")
def get_contact(contact_id: str):
    _, err = require_editor()
    if err:
        return err
    try:
        return success(contact_service.get_contact(contact_id))
    except ContactNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error(
            "お問い合わせ詳細の取得に失敗しました",
            status=500,
            details=str(exc),
        )


@contacts_bp.patch("/api/contacts/<contact_id>")
def patch_contact(contact_id: str):
    actor, err = require_editor()
    if err:
        return err
    payload = request.get_json(silent=True) or {}
    try:
        from services.audit_service import write_audit_log

        contact = contact_service.update_contact(contact_id, payload)
        write_audit_log(
            user_id=actor.id if actor else None,
            action="CONTACT_UPDATED",
            target_type="contact",
            target_id=contact_id,
        )
        return success(contact, message="ステータスを更新しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except ContactNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ステータス更新に失敗しました", status=500, details=str(exc))


@contacts_bp.delete("/api/contacts/<contact_id>")
def delete_contact(contact_id: str):
    actor, err = require_editor()
    if err:
        return err
    try:
        hard = str(request.args.get("hard") or "").lower() in {
            "1",
            "true",
            "yes",
        }
        if hard:
            contact = contact_service.hard_delete_contact(contact_id)
            try:
                from services.audit_service import write_audit_log

                write_audit_log(
                    user_id=actor.id if actor else None,
                    action="CONTACT_DELETED",
                    target_type="contact",
                    target_id=contact_id,
                )
            except Exception:
                pass
            return success(contact, message="お問い合わせを削除しました")

        contact = contact_service.archive_contact(contact_id)
        return success(contact, message="ステータスを更新しました")
    except ContactNotFoundError as exc:
        return error(str(exc), status=404)
    except Exception as exc:
        return error("ステータス更新に失敗しました", status=500, details=str(exc))
