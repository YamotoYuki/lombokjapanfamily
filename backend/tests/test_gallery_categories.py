from __future__ import annotations


def gallery_category_label(name: str | None) -> str:
    """Unset categories fall back to Other for public display."""
    text = (name or "").strip()
    return text or "Other"


def test_gallery_category_fallback_other():
    assert gallery_category_label(None) == "Other"
    assert gallery_category_label("") == "Other"
    assert gallery_category_label("  ") == "Other"
    assert gallery_category_label("Family") == "Family"
