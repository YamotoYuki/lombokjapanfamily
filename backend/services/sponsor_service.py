from __future__ import annotations

import re
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from services.supabase_service import get_supabase_client
from utils.validators import ValidationError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)

ALLOWED_PROJECT_TYPES = {
    "sponsor",
    "collaboration",
    "advertisement",
    "media",
    "other",
}
ALLOWED_STATUSES = {
    "proposal",
    "negotiating",
    "contracted",
    "production",
    "review",
    "published",
    "completed",
    "cancelled",
}
IN_PROGRESS_STATUSES = {
    "proposal",
    "negotiating",
    "contracted",
    "production",
    "review",
    "published",
}
REVENUE_STATUSES = {
    "contracted",
    "production",
    "review",
    "published",
    "completed",
}

ALLOWED_SPONSOR_FILE_EXTENSIONS = {
    "pdf",
    "docx",
    "xlsx",
    "zip",
    "png",
    "jpg",
    "jpeg",
}
ALLOWED_SPONSOR_FILE_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "application/octet-stream",
}
MAX_SPONSOR_FILE_BYTES = 20 * 1024 * 1024


class SponsorNotFoundError(LookupError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _optional_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _require_text(value: Any, message: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValidationError(message)
    return text


def _optional_email(value: Any) -> str | None:
    email = _optional_text(value)
    if not email:
        return None
    if not EMAIL_RE.match(email):
        raise ValidationError("メールアドレスの形式が正しくありません")
    return email


def _optional_url(value: Any, label: str = "URL") -> str | None:
    url = _optional_text(value)
    if not url:
        return None
    if not URL_RE.match(url):
        raise ValidationError(f"{label}の形式が正しくありません")
    return url


def _parse_amount(value: Any) -> float:
    if value is None or value == "":
        raise ValidationError("金額を入力してください")
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValidationError("金額の形式が正しくありません") from exc
    if amount < 0:
        raise ValidationError("金額は0以上で入力してください")
    return float(amount)


def _optional_date(value: Any) -> str | None:
    text = _optional_text(value)
    if not text:
        return None
    try:
        date.fromisoformat(text)
    except ValueError as exc:
        raise ValidationError("日付の形式が正しくありません") from exc
    return text


def validate_sponsor_payload(
    payload: dict[str, Any],
    *,
    partial: bool = False,
) -> dict[str, Any]:
    data: dict[str, Any] = {}

    if not partial or "company_name" in payload:
        data["company_name"] = _require_text(
            payload.get("company_name"),
            "会社名を入力してください",
        )

    if not partial or "project_name" in payload:
        data["project_name"] = _require_text(
            payload.get("project_name"),
            "案件名を入力してください",
        )

    if not partial or "project_type" in payload:
        project_type = _require_text(
            payload.get("project_type") or "sponsor",
            "案件種別を入力してください",
        )
        if project_type not in ALLOWED_PROJECT_TYPES:
            raise ValidationError("案件種別が不正です")
        data["project_type"] = project_type

    if not partial or "status" in payload:
        status = _require_text(
            payload.get("status") or "proposal",
            "状態を入力してください",
        )
        if status not in ALLOWED_STATUSES:
            raise ValidationError("状態が不正です")
        data["status"] = status

    if not partial or "amount" in payload:
        data["amount"] = _parse_amount(payload.get("amount"))

    if not partial or "contact_person" in payload:
        data["contact_person"] = _optional_text(payload.get("contact_person"))

    if not partial or "contact_email" in payload:
        data["contact_email"] = _optional_email(payload.get("contact_email"))

    if not partial or "contact_phone" in payload:
        data["contact_phone"] = _optional_text(payload.get("contact_phone"))

    for key in ("contract_date", "start_date", "due_date", "publish_date"):
        if not partial or key in payload:
            data[key] = _optional_date(payload.get(key))

    if not partial or "youtube_url" in payload:
        data["youtube_url"] = _optional_url(payload.get("youtube_url"), "YouTube URL")

    if not partial or "notes" in payload:
        data["notes"] = _optional_text(payload.get("notes"))

    if not partial or "attachment_url" in payload:
        data["attachment_url"] = _optional_url(
            payload.get("attachment_url"),
            "添付ファイルURL",
        )

    if not partial or "is_visible" in payload:
        value = payload.get("is_visible")
        if value is None or value == "":
            data["is_visible"] = True
        elif isinstance(value, bool):
            data["is_visible"] = value
        else:
            data["is_visible"] = str(value).lower() in {"1", "true", "yes", "on"}

    data["updated_at"] = _now_iso()
    return data


def normalize_sponsor(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    amount = row.get("amount")
    try:
        amount_value = float(amount) if amount is not None else 0.0
    except (TypeError, ValueError):
        amount_value = 0.0
    return {**row, "amount": amount_value}


def list_sponsors(
    *,
    keyword: str | None = None,
    status: str | None = None,
    project_type: str | None = None,
    page: int = 1,
    limit: int = 20,
    include_hidden: bool = False,
) -> dict[str, Any]:
    client = get_supabase_client()
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    start = (page - 1) * limit
    end = start + limit - 1

    query = client.table("sponsors").select("*", count="exact")
    if not include_hidden:
        query = query.eq("is_visible", True)

    if status:
        if status not in ALLOWED_STATUSES:
            raise ValidationError("状態が不正です")
        query = query.eq("status", status)

    if project_type:
        if project_type not in ALLOWED_PROJECT_TYPES:
            raise ValidationError("案件種別が不正です")
        query = query.eq("project_type", project_type)

    if keyword:
        query = query.or_(
            f"company_name.ilike.%{keyword}%,"
            f"project_name.ilike.%{keyword}%,"
            f"contact_person.ilike.%{keyword}%"
        )

    result = query.order("created_at", desc=True).range(start, end).execute()
    items = [normalize_sponsor(row) for row in (result.data or [])]
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": result.count or len(items),
    }


def get_sponsor(sponsor_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    row = client.table("sponsors").select("*").eq("id", sponsor_id).maybe_single().execute().data
    if not row:
        raise SponsorNotFoundError("案件が見つかりません")
    return normalize_sponsor(row)  # type: ignore[return-value]


def create_sponsor(payload: dict[str, Any]) -> dict[str, Any]:
    data = validate_sponsor_payload(payload, partial=False)
    data["created_at"] = _now_iso()
    client = get_supabase_client()
    result = client.table("sponsors").insert(data).execute()
    created = (result.data or [None])[0]
    if not created:
        raise ValidationError("案件の保存に失敗しました")
    return normalize_sponsor(created)  # type: ignore[return-value]


def update_sponsor(sponsor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    get_sponsor(sponsor_id)
    data = validate_sponsor_payload(payload, partial=True)
    client = get_supabase_client()
    result = client.table("sponsors").update(data).eq("id", sponsor_id).execute()
    if not result.data:
        raise SponsorNotFoundError("案件が見つかりません")
    return normalize_sponsor(result.data[0])  # type: ignore[return-value]


def soft_delete_sponsor(sponsor_id: str) -> dict[str, Any]:
    return update_sponsor(sponsor_id, {"is_visible": False})


def validate_sponsor_file(filename: str, content_type: str, size: int) -> str:
    if size <= 0:
        raise ValidationError("添付ファイルを選択してください")
    if size > MAX_SPONSOR_FILE_BYTES:
        raise ValidationError("添付ファイルのサイズが大きすぎます")
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_SPONSOR_FILE_EXTENSIONS:
        raise ValidationError("対応していないファイル形式です")
    if content_type and content_type not in ALLOWED_SPONSOR_FILE_MIME:
        if content_type not in {"application/octet-stream", ""}:
            raise ValidationError("対応していないファイル形式です")
    return "jpg" if extension == "jpeg" else extension


def upload_sponsor_file(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict[str, str]:
    extension = validate_sponsor_file(filename, content_type, len(file_bytes))
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    object_path = f"deals/{stamp}_{uuid.uuid4().hex[:10]}.{extension}"
    client = get_supabase_client()
    client.storage.from_("sponsor-files").upload(
        object_path,
        file_bytes,
        {"content-type": content_type or "application/octet-stream", "upsert": "false"},
    )
    try:
        signed = client.storage.from_("sponsor-files").create_signed_url(
            object_path,
            60 * 60 * 24 * 30,
        )
        url = (
            (signed or {}).get("signedURL")
            or (signed or {}).get("signedUrl")
            or (signed or {}).get("signed_url")
        )
    except Exception:
        url = None
    if not url:
        # Private bucket: public URL is not usable; return storage path reference.
        url = object_path
    return {"path": object_path, "url": url}


def _month_key(value: str | None) -> str | None:
    if not value:
        return None
    return value[:7]


def get_sponsor_stats() -> dict[str, Any]:
    client = get_supabase_client()
    rows = client.table("sponsors").select("*").eq("is_visible", True).execute().data or []

    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month
    month_prefix = f"{year:04d}-{month:02d}"

    total = len(rows)
    in_progress = 0
    completed = 0
    monthly_revenue = 0.0
    yearly_revenue = 0.0
    amounts: list[float] = []

    monthly_map: dict[str, dict[str, float]] = {}
    type_map: dict[str, int] = {}

    for row in rows:
        status = row.get("status") or "proposal"
        project_type = row.get("project_type") or "other"
        try:
            amount = float(row.get("amount") or 0)
        except (TypeError, ValueError):
            amount = 0.0

        if status in IN_PROGRESS_STATUSES:
            in_progress += 1
        if status == "completed":
            completed += 1

        type_map[project_type] = type_map.get(project_type, 0) + 1

        # Prefer contract_date, then publish_date, then created_at for revenue month
        revenue_date = (
            row.get("contract_date")
            or row.get("publish_date")
            or (row.get("created_at") or "")[:10]
        )
        key = _month_key(str(revenue_date) if revenue_date else None)
        if key:
            bucket = monthly_map.setdefault(key, {"revenue": 0.0, "count": 0})
            bucket["count"] += 1
            if status in REVENUE_STATUSES:
                bucket["revenue"] += amount

        if status in REVENUE_STATUSES:
            amounts.append(amount)
            if key and key.startswith(f"{year:04d}-"):
                yearly_revenue += amount
            if key == month_prefix:
                monthly_revenue += amount

    monthly_series = []
    for i in range(11, -1, -1):
        y = year
        m = month - i
        while m <= 0:
            m += 12
            y -= 1
        key = f"{y:04d}-{m:02d}"
        bucket = monthly_map.get(key, {"revenue": 0.0, "count": 0})
        monthly_series.append(
            {
                "label": key,
                "revenue": round(bucket["revenue"], 2),
                "count": int(bucket["count"]),
            }
        )

    type_breakdown = [
        {"type": key, "count": value} for key, value in sorted(type_map.items(), key=lambda x: x[0])
    ]

    average_amount = round(sum(amounts) / len(amounts), 2) if amounts else 0.0

    recent = sorted(
        rows,
        key=lambda item: item.get("created_at") or "",
        reverse=True,
    )[:5]

    return {
        "total": total,
        "in_progress_count": in_progress,
        "completed_count": completed,
        "monthly_revenue": round(monthly_revenue, 2),
        "yearly_revenue": round(yearly_revenue, 2),
        "average_amount": average_amount,
        "monthly_series": monthly_series,
        "type_breakdown": type_breakdown,
        "recent": [normalize_sponsor(item) for item in recent],
    }
