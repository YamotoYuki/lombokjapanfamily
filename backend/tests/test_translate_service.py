from services.translate_service import translate_fields
from utils.validators import ValidationError
import pytest


def test_translate_requires_source_text():
    with pytest.raises(ValidationError):
        translate_fields({"title": "  ", "content": ""}, target="en")


def test_translate_rejects_bad_target():
    with pytest.raises(ValidationError):
        translate_fields(
            {"title": "テスト"},
            target="fr",  # type: ignore[arg-type]
        )
