"""CMS draft helpers: translate CMS fields between ja / en / id, any direction."""

from __future__ import annotations

import json
import logging
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Literal

from utils.validators import ValidationError

logger = logging.getLogger(__name__)

Lang = Literal["ja", "en", "id"]
# Kept as an alias: existing call sites (translate_fields(..., target=...)) type
# their target kwarg against this name.
TargetLang = Lang
ALL_LANGS: frozenset[Lang] = frozenset({"ja", "en", "id"})

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
    http_status: int | None = None
    for attempt in range(_RETRY_COUNT):
        try:
            with urllib.request.urlopen(request, timeout=_TIMEOUT_SEC) as response:
                http_status = response.status
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

    response_status = (payload or {}).get("responseStatus")
    # MyMemory's own system message for this call — never contains the
    # source/translated text or any secret, safe to log in full.
    response_details = str((payload or {}).get("responseDetails") or "").strip()
    quota_finished = bool((payload or {}).get("quotaFinished"))
    translated = (
        ((payload or {}).get("responseData") or {}).get("translatedText") or ""
    ).strip()
    upper = translated.upper()

    # MyMemory signals daily-quota exhaustion in two different ways, and a
    # known MyMemory quirk is that BOTH the HTTP status and responseStatus
    # can still read 200 when this happens — the "warning" is delivered as
    # if it were the translation itself, not as an HTTP-level error. So
    # `quotaFinished` (an explicit boolean MyMemory sets) is checked first,
    # as the most reliable signal, in addition to the text-based check this
    # code originally relied on alone.
    if quota_finished or "MYMEMORY WARNING" in upper:
        logger.warning(
            "MyMemory quota exhausted: http_status=%s responseStatus=%s "
            "quotaFinished=%s responseDetails=%s MYMEMORY_EMAIL configured=%s",
            http_status,
            response_status,
            quota_finished,
            response_details[:200],
            bool(email),
        )
        raise TranslationQuotaError(_QUOTA_ERROR_MESSAGE)
    if not translated:
        logger.warning(
            "MyMemory returned an empty translation: http_status=%s "
            "responseStatus=%s responseDetails=%s MYMEMORY_EMAIL configured=%s",
            http_status,
            response_status,
            response_details[:200],
            bool(email),
        )
        raise ValidationError("翻訳結果を取得できませんでした")
    if upper.startswith("INVALID "):
        logger.warning(
            "MyMemory rejected the request: responseStatus=%s responseDetails=%s",
            response_status,
            response_details[:200],
        )
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


def translate_text(text: str, source: Lang, target: Lang) -> str:
    source_text = (text or "").strip()
    if not source_text:
        return ""

    parts = _chunk_text(source_text)
    translated_parts: list[str] = []
    for index, part in enumerate(parts):
        if index > 0:
            time.sleep(_BETWEEN_CALLS_DELAY_SEC)
        translated_parts.append(
            _mymemory_translate(part, source=source, target=target)
        )
    if "\n" in source_text:
        return "\n".join(translated_parts)
    return " ".join(translated_parts)


def translate_from_japanese(text: str, target: TargetLang) -> str:
    """Back-compat wrapper for the original ja -> target-only signature."""
    return translate_text(text, "ja", target)


# --- language auto-detection --------------------------------------------
#
# MyMemory (the translation backend below) has no auto-detect endpoint of
# its own — `langpair` requires an explicit source. Japanese is trivial to
# spot from its script (Hiragana/Katakana/Kanji never appear in en/id text),
# but English and Indonesian share the Latin alphabet, so a naive character
# heuristic can't tell them apart. Instead this counts each text's words
# against a curated list of common function words ("yang", "dan", "the",
# "is", ...) for each language — the same bag-of-stopwords technique small
# language-id libraries use — and only commits to an answer when one
# language's words clearly outnumber the other's.

_JAPANESE_SCRIPT_RE = re.compile(r"[぀-ヿ一-鿿]")
_WORD_RE = re.compile(r"[a-zA-Z']+")

_EN_STOPWORDS = frozenset(
    {
        "the", "and", "is", "are", "was", "were", "to", "of", "in", "on",
        "for", "with", "this", "that", "it", "as", "at", "by", "an", "or",
        "from", "but", "not", "have", "has", "had", "will", "would", "we",
        "you", "they", "he", "she", "be", "been", "its", "his", "her",
        "our", "your", "their", "a", "i", "my",
    }
)
_ID_STOPWORDS = frozenset(
    {
        "yang", "dan", "di", "ke", "dari", "ini", "itu", "tidak", "akan",
        "dengan", "untuk", "pada", "adalah", "saya", "kami", "kita",
        "mereka", "bisa", "sudah", "belum", "atau", "juga", "karena",
        "jika", "saat", "seperti", "dalam", "oleh", "kamu", "anda", "ada",
        "para", "semua", "dapat", "kepada", "banyak",
    }
)


def detect_language(text: str) -> Lang | None:
    """Best-effort ja/en/id detection. Returns None when the text is too
    short or ambiguous to call confidently — the caller should ask the user
    to pick the source language explicitly rather than guess wrong."""
    if not text or not text.strip():
        return None
    if _JAPANESE_SCRIPT_RE.search(text):
        return "ja"

    words = _WORD_RE.findall(text.lower())
    if not words:
        return None
    en_score = sum(1 for w in words if w in _EN_STOPWORDS)
    id_score = sum(1 for w in words if w in _ID_STOPWORDS)
    if en_score == id_score:
        return None
    return "en" if en_score > id_score else "id"


def detect_language_from_fields(fields: dict[str, Any]) -> Lang | None:
    combined = " ".join(str(v) for v in (fields or {}).values() if v)
    return detect_language(combined)


def translate_fields(
    fields: dict[str, Any],
    *,
    target: Lang,
    source: Lang = "ja",
) -> dict[str, str]:
    if target not in ALL_LANGS:
        raise ValidationError("翻訳先言語が正しくありません")
    if source not in ALL_LANGS:
        raise ValidationError("翻訳元言語が正しくありません")
    if source == target:
        raise ValidationError("翻訳元と翻訳先に同じ言語は指定できません")

    cleaned: dict[str, str] = {}
    for key, value in (fields or {}).items():
        name = str(key or "").strip()
        if not name:
            continue
        text = str(value or "").strip()
        if text:
            cleaned[name] = text

    if not cleaned:
        raise ValidationError("翻訳する文言を入力してください")

    result: dict[str, str] = {}
    for index, (key, text) in enumerate(cleaned.items()):
        if index > 0:
            time.sleep(_BETWEEN_CALLS_DELAY_SEC)
        result[key] = translate_text(text, source, target)
    return result


def translate_announcement_fields(
    *,
    title_ja: str,
    content_ja: str,
    target: TargetLang,
) -> dict[str, str]:
    result = translate_fields(
        {"title": title_ja, "content": content_ja},
        source="ja",
        target=target,
    )
    return {
        "title": result.get("title", ""),
        "content": result.get("content", ""),
    }
