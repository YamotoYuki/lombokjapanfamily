"""PostgREST or()-filter injection hardening.

Covers the STEP16 security audit findings: user-supplied search keywords
were concatenated directly into `.or_()` filter strings across several
services, including the unauthenticated `GET /api/videos?q=...` endpoint.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app import create_app
from utils.validators import build_or_filter, sanitize_search_term

NORMAL_TERMS = [
    "ロンボク島の海",  # Japanese
    "family trip",  # English
    "keluarga bahagia",  # Indonesian
]

STRUCTURAL_CHARS = [",", "(", ")", ":"]

ATTACK_STRINGS = [
    "%",
    ",",
    ".",
    "(",
    ")",
    '"',
    "'",
    "\\",
    "title.ilike.%",
    "),or(",
    "),is_visible.eq.false,or(x.eq.x",
    "",
    "   ",
    "a" * 5000,
    "田中🇮🇩さん​　テスト",  # mixed unicode incl. zero-width/full-width space
]


def test_sanitize_strips_postgrest_structural_chars():
    for ch in STRUCTURAL_CHARS:
        assert ch not in sanitize_search_term(f"foo{ch}bar")


def test_sanitize_preserves_normal_search_terms():
    for term in NORMAL_TERMS:
        cleaned = sanitize_search_term(term)
        # No structural chars present in these terms, so nothing should change
        # except possible whitespace normalization.
        assert cleaned == " ".join(term.split())


def test_sanitize_handles_empty_and_whitespace():
    assert sanitize_search_term("") == ""
    assert sanitize_search_term("   ") == ""
    assert sanitize_search_term(None) == ""


def test_sanitize_caps_length():
    cleaned = sanitize_search_term("a" * 5000)
    assert len(cleaned) <= 100


def test_sanitize_never_raises_on_attack_strings():
    for s in ATTACK_STRINGS:
        cleaned = sanitize_search_term(s)
        assert isinstance(cleaned, str)
        for ch in STRUCTURAL_CHARS:
            assert ch not in cleaned


def test_build_or_filter_returns_none_for_empty_term():
    assert build_or_filter("", ["title", "description"]) is None
    assert build_or_filter(sanitize_search_term(",(),"), ["title"]) is None


def test_build_or_filter_shape():
    clause = build_or_filter("foo", ["title", "description"])
    assert clause == "title.ilike.%foo%,description.ilike.%foo%"
    # Exactly one comma per extra column, no stray parens/colons.
    assert clause.count(",") == 1
    assert "(" not in clause and ")" not in clause


def test_build_or_filter_eq_without_wildcard():
    clause = build_or_filter("abc", ["id", "slug"], operator="eq", wildcard=False)
    assert clause == "id.eq.abc,slug.eq.abc"


def _mock_supabase_query():
    """Build a MagicMock that mimics the postgrest chained query builder."""
    query = MagicMock()
    for method in ("select", "or_", "eq", "order"):
        getattr(query, method).return_value = query
    query.execute.return_value = MagicMock(data=[])
    return query


def test_public_videos_search_survives_attack_strings_without_500():
    app = create_app()
    client = app.test_client()
    for payload in ATTACK_STRINGS:
        with patch("services.supabase_service.get_supabase_client") as mocked_client:
            table = MagicMock()
            table.table.return_value = _mock_supabase_query()
            mocked_client.return_value = table
            response = client.get("/api/videos", query_string={"q": payload})
            assert response.status_code == 200, (payload, response.status_code)
            body = response.get_json()
            assert body["ok"] is True
            assert "items" in body["data"]


def test_public_videos_search_forces_visible_true_even_with_malicious_q():
    app = create_app()
    client = app.test_client()
    with patch("routes.youtube_routes.supabase_service.list_videos") as mocked:
        mocked.return_value = []
        response = client.get(
            "/api/videos",
            query_string={"q": "),is_visible.eq.false,or(x.eq.x", "is_visible": "false"},
        )
        assert response.status_code == 200
        kwargs = mocked.call_args.kwargs
        assert kwargs.get("is_visible") is True


def test_videos_or_clause_never_contains_raw_structural_chars_from_q():
    """The string ultimately passed to postgrest .or_() must not carry
    unescaped structural characters sourced from user input."""
    app = create_app()
    client = app.test_client()
    malicious = "),is_visible.eq.false,or(x.eq.x"
    with patch("services.supabase_service.get_supabase_client") as mocked_client:
        query = _mock_supabase_query()
        table = MagicMock()
        table.table.return_value = query
        mocked_client.return_value = table
        response = client.get("/api/videos", query_string={"q": malicious})
        assert response.status_code == 200
        assert query.or_.called
        called_with = query.or_.call_args.args[0]
        # Only the two developer-controlled ilike clauses may contain commas;
        # none of the stripped structural characters from user input may
        # leak through.
        assert called_with.count(",") == 1
        assert "(" not in called_with
        assert ")" not in called_with
