from unittest.mock import MagicMock, patch

import pytest

from app import create_app


def test_get_videos_without_page_param_uses_unpaginated_list():
    """Backward compatibility: callers that omit `page` (the admin
    featured-count check, the home page fallback) must keep getting every
    matching row from the original list_videos(), unchanged."""
    app = create_app()
    client = app.test_client()
    with patch("routes.youtube_routes.supabase_service.list_videos") as mocked, \
        patch("routes.youtube_routes.supabase_service.list_videos_page") as paged:
        mocked.return_value = [{"id": "1"}, {"id": "2"}]
        response = client.get("/api/videos")
        assert response.status_code == 200
        body = response.get_json()
        assert body["data"]["items"] == [{"id": "1"}, {"id": "2"}]
        assert body["data"]["total"] == 2
        mocked.assert_called_once()
        paged.assert_not_called()


def test_get_videos_with_page_param_uses_paginated_list():
    app = create_app()
    client = app.test_client()
    with patch("routes.youtube_routes.supabase_service.list_videos") as unpaged, \
        patch("routes.youtube_routes.supabase_service.list_videos_page") as mocked:
        mocked.return_value = {
            "items": [{"id": "1"}],
            "total": 11,
            "page": 2,
            "limit": 10,
        }
        response = client.get("/api/videos?page=2&limit=10")
        assert response.status_code == 200
        body = response.get_json()
        assert body["data"]["total"] == 11
        assert body["data"]["page"] == 2
        kwargs = mocked.call_args.kwargs
        assert kwargs["page"] == 2
        assert kwargs["limit"] == 10
        unpaged.assert_not_called()


def _mock_query_result(data: list[dict], count: int) -> MagicMock:
    result = MagicMock()
    result.data = data
    result.count = count
    return result


def _mock_client_returning(result: MagicMock) -> MagicMock:
    client = MagicMock()
    table = MagicMock()
    table.select.return_value = table
    table.eq.return_value = table
    table.or_.return_value = table
    table.order.return_value = table
    table.range.return_value = table
    table.execute.return_value = result
    client.table.return_value = table
    return client


def test_list_videos_page_computes_range_from_page_and_limit():
    from services import supabase_service

    result = _mock_query_result([{"id": "1"}] * 10, count=25)
    client = _mock_client_returning(result)
    with patch("services.supabase_service.get_supabase_client", return_value=client):
        page = supabase_service.list_videos_page(page=3, limit=10)
    assert page["total"] == 25
    assert page["page"] == 3
    assert page["limit"] == 10
    assert len(page["items"]) == 10
    # page 3 of limit 10 -> rows 20..29 (Supabase's inclusive .range(start, end))
    client.table.return_value.range.assert_called_once_with(20, 29)


def test_list_videos_page_clamps_page_and_limit():
    from services import supabase_service

    result = _mock_query_result([], count=0)
    client = _mock_client_returning(result)
    with patch("services.supabase_service.get_supabase_client", return_value=client):
        page = supabase_service.list_videos_page(page=0, limit=0)
    assert page["page"] == 1
    assert page["limit"] == 1
    assert page["total"] == 0
    assert page["items"] == []


def test_list_videos_page_caps_limit_at_100():
    from services import supabase_service

    result = _mock_query_result([], count=0)
    client = _mock_client_returning(result)
    with patch("services.supabase_service.get_supabase_client", return_value=client):
        page = supabase_service.list_videos_page(page=1, limit=1000)
    assert page["limit"] == 100


@pytest.mark.parametrize(
    "sort,expected_first_order_call",
    [
        ("popular", (("views",), {"desc": True})),
        ("oldest", (("published_at",), {"desc": False})),
        ("newest", (("published_at",), {"desc": True})),
        (None, (("display_order",), {"desc": False})),
    ],
)
def test_list_videos_page_applies_requested_sort(sort, expected_first_order_call):
    """popular sorts by the existing `views` column at the DB level — no
    fetch-everything-then-sort-client-side, and no new column needed."""
    from services import supabase_service

    result = _mock_query_result([], count=0)
    client = _mock_client_returning(result)
    with patch("services.supabase_service.get_supabase_client", return_value=client):
        supabase_service.list_videos_page(page=1, limit=10, sort=sort)
    first_call = client.table.return_value.order.call_args_list[0]
    assert first_call.args == expected_first_order_call[0]
    assert first_call.kwargs == expected_first_order_call[1]


@pytest.mark.parametrize("status", ["all", "published", "hidden"])
@pytest.mark.parametrize("sort", ["newest", "popular", "oldest"])
def test_get_videos_route_all_status_and_sort_combinations(status, sort):
    """All 9 status x sort combinations reach list_videos_page with the
    right is_visible/sort kwargs, and never fall back to the unpaginated
    list_videos()."""
    app = create_app()
    client = app.test_client()
    is_visible_map = {"all": None, "published": True, "hidden": False}
    query = f"/api/videos?page=1&limit=10&sort={sort}"
    if status != "all":
        query += f"&is_visible={'true' if status == 'published' else 'false'}"

    with patch("routes.youtube_routes.supabase_service.list_videos") as unpaged, \
        patch("routes.youtube_routes.supabase_service.list_videos_page") as mocked:
        mocked.return_value = {"items": [], "total": 0, "page": 1, "limit": 10}
        with patch("routes.youtube_routes.is_staff_request", return_value=True):
            response = client.get(query)
        assert response.status_code == 200
        kwargs = mocked.call_args.kwargs
        assert kwargs["sort"] == sort
        assert kwargs["is_visible"] == is_visible_map[status]
        unpaged.assert_not_called()


def test_get_videos_rejects_invalid_sort():
    app = create_app()
    client = app.test_client()
    with patch("routes.youtube_routes.supabase_service.list_videos_page") as mocked:
        response = client.get("/api/videos?page=1&limit=10&sort=bogus")
        assert response.status_code == 400
        mocked.assert_not_called()
