from __future__ import annotations

from flask import Blueprint, request

from services.translate_service import translate_fields
from utils.auth import require_editor
from utils.response import error, success
from utils.validators import ValidationError

translate_bp = Blueprint("translate", __name__)


@translate_bp.post("/api/translate")
def translate_ja_fields():
    """Translate arbitrary Japanese CMS draft fields to en or id."""
    _, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        target = str(payload.get("target") or "").strip().lower()
        if target not in {"en", "id"}:
            return error("翻訳先は en または id を指定してください", status=400)
        fields = payload.get("fields")
        if not isinstance(fields, dict):
            return error("fields はオブジェクトで指定してください", status=400)
        translated = translate_fields(fields, target=target)  # type: ignore[arg-type]
        return success({"fields": translated}, message="翻訳しました")
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("翻訳に失敗しました", status=500, details=str(exc))
