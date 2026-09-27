from __future__ import annotations

from flask import Blueprint, request

from services.translate_service import (
    ALL_LANGS,
    detect_language_from_fields,
    translate_fields,
)
from utils.auth import require_editor
from utils.response import error, success
from utils.validators import ValidationError

translate_bp = Blueprint("translate", __name__)


@translate_bp.post("/api/translate")
def translate_ja_fields():
    """Translate arbitrary CMS draft fields between ja/en/id, any direction.

    `source` accepts ja/en/id/auto (or is omitted, defaulting to "ja" for
    backward compatibility with older frontend builds and the other
    ja-only translate callers in this codebase)."""
    _, err = require_editor()
    if err:
        return err
    try:
        payload = request.get_json(silent=True) or {}
        target = str(payload.get("target") or "").strip().lower()
        if target not in ALL_LANGS:
            return error("翻訳先は ja, en, id のいずれかを指定してください", status=400)

        fields = payload.get("fields")
        if not isinstance(fields, dict):
            return error("fields はオブジェクトで指定してください", status=400)

        raw_source = str(payload.get("source") or "ja").strip().lower()
        if raw_source == "auto":
            detected = detect_language_from_fields(fields)  # type: ignore[arg-type]
            if not detected:
                return error(
                    "翻訳元の言語を自動判定できませんでした。原文言語を選択してください。",
                    status=400,
                )
            source = detected
        elif raw_source in ALL_LANGS:
            source = raw_source
        else:
            return error(
                "翻訳元は ja, en, id, auto のいずれかを指定してください", status=400
            )

        if source == target:
            return error("翻訳元と翻訳先に同じ言語は指定できません", status=400)

        translated = translate_fields(
            fields,  # type: ignore[arg-type]
            source=source,  # type: ignore[arg-type]
            target=target,  # type: ignore[arg-type]
        )
        return success(
            {"fields": translated, "source": source}, message="翻訳しました"
        )
    except ValidationError as exc:
        return error(str(exc), status=400)
    except Exception as exc:
        return error("翻訳に失敗しました", status=500, details=str(exc))
