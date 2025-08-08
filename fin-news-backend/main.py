import os
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

# ---------- Settings ----------
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "").strip()
NEWSAPI_BASE = "https://newsapi.org/v2"

# Comma-separated list of allowed origins (Vercel URL, local dev, etc.)
# e.g., "https://your-frontend.vercel.app,http://localhost:5173"
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]

# ---------- App ----------
app = FastAPI(title="AI Financial News Summarizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Health ----------
@app.get("/health")
def health():
    return {"status": "ok", "newsapi_key_configured": bool(NEWSAPI_KEY)}

# ---------- News API proxy ----------
@app.get("/news/top-headlines")
async def top_headlines(
    country: str = Query("us", min_length=2, max_length=2, description="2-letter ISO country code"),
    q: Optional[str] = Query(None, description="Search query"),
    pageSize: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="business, technology, etc.")
):
    if not NEWSAPI_KEY:
        raise HTTPException(status_code=500, detail="NEWSAPI_KEY not configured")

    params = {
        "apiKey": NEWSAPI_KEY,
        "country": country.lower(),
        "pageSize": pageSize,
    }
    if q: params["q"] = q
    if category: params["category"] = category

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(f"{NEWSAPI_BASE}/top-headlines", params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

@app.get("/news/everything")
async def everything(
    q: str = Query(..., min_length=2, description="Search query"),
    sortBy: str = Query("publishedAt", pattern="^(relevancy|popularity|publishedAt)$"),
    pageSize: int = Query(20, ge=1, le=100),
    language: str = Query("en", pattern="^[a-z]{2}$")
):
    if not NEWSAPI_KEY:
        raise HTTPException(status_code=500, detail="NEWSAPI_KEY not configured")

    params = {
        "apiKey": NEWSAPI_KEY,
        "q": q,
        "sortBy": sortBy,
        "pageSize": pageSize,
        "language": language
    }

    async with httpx.AsyncClient(timeout=25) as client:
        r = await client.get(f"{NEWSAPI_BASE}/everything", params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()
