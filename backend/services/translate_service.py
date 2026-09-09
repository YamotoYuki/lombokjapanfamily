"""CMS draft helpers: translate Japanese source fields → en / id."""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Literal

from utils.validators import ValidationError

logger = logging.getLogger(__name__)

TargetLang = Literal["en", "id"]

_CHUNK_SIZE = 450
_TIMEOUT_SEC = 20
# MyMemory free tier rate-limits bursty sequential calls from shared cloud IPs.
_RETRY_COUNT = 3
_RETRY_BASE_DELAY_SEC = 1.2
_BETWEEN_CALLS_DELAY_SEC = 0.6

# Two distinct failure modes the admin UI needs to tell apart:
#   - quota: MyMemory's free daily allowance is exhausted (HTTP 429, or the
#     "MYMEMORY WARNING" text MyMemory sometimes embeds in a 200 response).
#     Nothing is wrong with our server or the network; retrying sooner won't
#     help, only waiting for the daily reset (or entering text manually) will.
#   - connection: a genuine network/upstream problem (DNS, timeout, TLS,
#     5xx after retries). Worth retrying again shortly.
_QUOTA_ERROR_MESSAGE = (
    "本日の無料翻訳回数の上限に達しました。\n\n"
    "MyMemory API の利用制限により\n"
    "本日の自動翻訳は利用できません。\n\n"
    "明日以降に再度お試しください。\n"
    "または手動で翻訳を入力してください。"
)
_CONNECTION_ERROR_MESSAGE = (
    "翻訳サービスに接続できません。\n\n時間を空けて再度お試しください。"
)


class TranslationQuotaError(ValidationError):
    """MyMemory's free daily translation quota has been exhausted."""


class TranslationConnectionError(ValidationError):
    """Could not reach MyMemory (network/DNS/timeout/upstream error)."""


def _mymemory_translate(text: str, *, source: str, target: str) -> str:
    query = urllib.parse.urlencode(
        {
            "q": text,
            "langpair": f"{source}|{target}",
        }
    )
    url = f"https://api.mymemory.translated.net/get?{query}"
    email = (os.getenv("MYMEMORY_EMAIL") or "").strip()
    if email:
        url = f"{url}&de={urllib.parse.quote(email)}"

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "LombokJapanFamilyCMS/1.0"},
        method="GET",
    )

    last_error: BaseException | None = None
    for attempt in range(_RETRY_COUNT):
        try:
            with urllib.request.urlopen(request, timeout=_TIMEOUT_SEC) as response:
                payload = json.loads(response.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as exc:
            last_error = exc
            logger.warning(
                "MyMemory HTTPError: status=%s attempt=%s/%s MYMEMORY_EMAIL configured=%s",
                exc.code,
                attempt + 1,
                _RETRY_COUNT,
                bool(email),
            )
            # HTTP 429 is MyMemory telling us we've hit a rate/quota limit —
            # distinct from a genuine connection problem. Still worth one
            # retry with backoff in case it's just a burst limit, but if it
            # persists after retries it reads as the daily quota message,
            # not the generic connection-failure one.
            if exc.code == 429 and attempt < _RETRY_COUNT - 1:
                time.sleep(_RETRY_BASE_DELAY_SEC * (attempt + 1))
                continue
            if exc.code == 429:
                raise TranslationQuotaError(_QUOTA_ERROR_MESSAGE) from exc
            # Retry transient upstream failures only.
            if exc.code not in {502, 503, 504} or attempt >= _RETRY_COUNT - 1:
                raise TranslationConnectionError(_CONNECTION_ERROR_MESSAGE) from exc
            time.sleep(_RETRY_BASE_DELAY_SEC * (attempt + 1))
        except urllib.error.URLError as exc:
            last_error = exc
            logger.warning(
                "MyMemory URLError: reason=%s attempt=%s/%s MYMEMORY_EMAIL configured=%s",
                exc.reason,
                attempt + 1,
                _RETRY_COUNT,
                bool(email),
            )
            if attempt >= _RETRY_COUNT - 1:
                raise TranslationConnectionError(_CONNECTION_ERROR_MESSAGE) from exc
            time.sleep(_RETRY_BASE_DELAY_SEC * (attempt + 1))
        except json.JSONDecodeError as exc:
            raise ValidationError("翻訳結果の解析に失敗しました") from exc
    else:
        raise TranslationConnectionError(_CONNECTION_ERROR_MESSAGE) from last_error

    translated = (
        ((payload or {}).get("responseData") or {}).get("translatedText") or ""
    ).strip()
    if not translated:
        raise ValidationError("翻訳結果を取得できませんでした")
    upper = translated.upper()
    # MyMemory signals daily-quota exhaustion as an HTTP 200 with this text
    # embedded in the translation field, not an HTTP error — must be caught
    # here, separately from the HTTPError branch above.
    if "MYMEMORY WARNING" in upper:
        raise TranslationQuotaError(_QUOTA_ERROR_MESSAGE)
    if upper.startswith("INVALID "):
        raise ValidationError(
            "翻訳に失敗しました。文言を短くして再試行してください"
        )
    return translated


def _chunk_text(text: str) -> list[str]:
    cleaned = text.strip()
    if not cleaned:
        return []
    if len(cleaned) <= _CHUNK_SIZE:
        return [cleaned]

    chunks: list[str] = []
    remaining = cleaned
    while remaining:
        if len(remaining) <= _CHUNK_SIZE:
            chunks.append(remaining)
            break
        cut = remaining.rfind("\n", 0, _CHUNK_SIZE)
        if cut < _CHUNK_SIZE // 3:
            cut = remaining.rfind("。", 0, _CHUNK_SIZE)
        if cut < _CHUNK_SIZE // 3:
            cut = remaining.rfind(" ", 0, _CHUNK_SIZE)
        if cut < _CHUNK_SIZE // 3:
            cut = _CHUNK_SIZE
        chunks.append(remaining[:cut].strip())
        remaining = remaining[cut:].lstrip()
    return [c for c in chunks if c]


def translate_from_japanese(text: str, target: TargetLang) -> str:
    source = (text or "").strip()
    if not source:
        return ""

    parts = _chunk_text(source)
    translated_parts: list[str] = []
    for index, part in enumerate(parts):
        if index > 0:
            time.sleep(_BETWEEN_CALLS_DELAY_SEC)
        translated_parts.append(
            _mymemory_translate(part, source="ja", target=target)
        )
    if "\n" in source:
        return "\n".join(translated_parts)
    return " ".join(translated_parts)


def translate_fields(
    fields: dict[str, Any],
    *,
    target: TargetLang,
) -> dict[str, str]:
    if target not in {"en", "id"}:
        raise ValidationError("翻訳先言語が正しくありません")

    cleaned: dict[str, str] = {}
    for key, value in (fields or {}).items():
        name = str(key or "").strip()
        if not name:
            continue
        text = str(value or "").strip()
        if text:
            cleaned[name] = text

    if not cleaned:
        raise ValidationError("翻訳する日本語の文言を入力してください")

    result: dict[str, str] = {}
    for index, (key, text) in enumerate(cleaned.items()):
        if index > 0:
            time.sleep(_BETWEEN_CALLS_DELAY_SEC)
        result[key] = translate_from_japanese(text, target)
    return result


def translate_announcement_fields(
    *,
    title_ja: str,
    content_ja: str,
    target: TargetLang,
) -> dict[str, str]:
    result = translate_fields(
        {"title": title_ja, "content": content_ja},
        target=target,
    )
    return {
        "title": result.get("title", ""),
        "content": result.get("content", ""),
    }
