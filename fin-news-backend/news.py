"""Live data: NewsAPI headlines, Finnhub quotes, and article body extraction.

Keys stay on the server. Responses are cached in memory so the free tiers of
both providers survive real traffic.
"""
import asyncio
import os
import time

import httpx
import trafilatura

HEADLINES_TTL = 300  # seconds
QUOTES_TTL = 60
TAPE_SYMBOLS = ["NVDA", "AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "META", "JPM", "WMT", "V", "MA"]

_cache: dict[str, tuple[float, object]] = {}
# Article URLs we have served. /extract only fetches these, so it cannot be
# pointed at arbitrary hosts (internal addresses, metadata endpoints, ...).
_known_urls: set[str] = set()


class NotConfigured(RuntimeError):
    """A required provider key is missing."""


def _cached(key: str, ttl: int):
    hit = _cache.get(key)
    if hit and time.monotonic() - hit[0] < ttl:
        return hit[1]
    return None


def _store(key: str, value):
    _cache[key] = (time.monotonic(), value)
    return value


async def headlines() -> list[dict]:
    if (hit := _cached("headlines", HEADLINES_TTL)) is not None:
        return hit
    key = os.getenv("NEWSAPI_KEY")
    if not key:
        raise NotConfigured("NEWSAPI_KEY is not set")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            "https://newsapi.org/v2/top-headlines",
            params={"category": "business", "language": "en", "pageSize": 30},
            headers={"X-Api-Key": key},
        )
    r.raise_for_status()

    articles = []
    for a in r.json().get("articles", []):
        title, url = a.get("title"), a.get("url")
        # NewsAPI returns "[Removed]" placeholders for withdrawn stories.
        if not title or not url or title == "[Removed]":
            continue
        source = (a.get("source") or {}).get("name") or ""
        # NewsAPI appends " - Publisher" to titles; the source is shown separately.
        if source and title.endswith(f" - {source}"):
            title = title[: -len(source) - 3]
        articles.append(
            {
                "title": title,
                "description": a.get("description") or "",
                "source": source,
                "url": url,
                "publishedAt": a.get("publishedAt"),
            }
        )
        _known_urls.add(url)
    return _store("headlines", articles)


async def quotes() -> list[dict]:
    if (hit := _cached("quotes", QUOTES_TTL)) is not None:
        return hit
    key = os.getenv("FINNHUB_API_KEY")
    if not key:
        raise NotConfigured("FINNHUB_API_KEY is not set")

    async with httpx.AsyncClient(timeout=10) as client:

        async def one(symbol: str):
            r = await client.get(
                "https://finnhub.io/api/v1/quote",
                params={"symbol": symbol},
                headers={"X-Finnhub-Token": key},
            )
            r.raise_for_status()
            d = r.json()
            # Finnhub answers 0 for unknown symbols / closed feeds.
            if not d.get("c"):
                return None
            return {"symbol": symbol, "last": d["c"], "change": d.get("dp") or 0.0}

        results = await asyncio.gather(*(one(s) for s in TAPE_SYMBOLS), return_exceptions=True)

    out = [q for q in results if isinstance(q, dict)]
    if not out:
        raise RuntimeError("no quotes available")
    return _store("quotes", out)


class UnknownArticle(ValueError):
    """The URL was not served by /headlines."""


async def extract(url: str) -> str:
    if url not in _known_urls:
        raise UnknownArticle(url)
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        r = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (TapeReader)"})
    r.raise_for_status()
    # trafilatura is synchronous and CPU-bound; keep it off the event loop.
    text = await asyncio.to_thread(trafilatura.extract, r.text, include_comments=False)
    # Stay under the 20k limit on /summarize and /tag, with room for the title.
    return (text or "").strip()[:15000]
