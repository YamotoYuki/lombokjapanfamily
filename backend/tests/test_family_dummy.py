from __future__ import annotations

from services.family_service import is_dummy_family_name


def test_is_dummy_name_prefix():
    assert is_dummy_family_name("DUMMY - Family Member 1") is True
    assert is_dummy_family_name("DUMMY- Family Member 2") is True
    assert is_dummy_family_name("dummy - test") is True
    assert is_dummy_family_name("Real Member") is False
    assert is_dummy_family_name("") is False
    assert is_dummy_family_name(None) is False
