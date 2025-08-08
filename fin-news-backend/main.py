# fin-news-backend/main.py
import os
from typing import Optional, Dict, List, Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

# ---------- Settings ----------
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "").strip()
NEWSAPI_BASE = "https://newsapi.org/v2"

# Comma-separated list of allowed origins (Vercel URL, local dev, etc.)
# e.g., "https://your-frontend.vercel.app,http://localhost:5173"
# ---- CORS setup (replace your current add_middleware block) ----

ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "https://ai-financial-news-summarizer-fx36-peyqhkli1.vercel.app/" , "http://localhost:5173").split(",") if o.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,          # exact matches (prod + localhost)
    allow_origin_regex=ALLOWED_ORIGIN_REGEX, # any preview like https://*.vercel.app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- App ----
app = FastAPI(title="AI Financial News Summarizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Models for /summarize ----
class SummarizeRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None

class SummarizeResponse(BaseModel):
    summary: str
    sentiment: str
    tags: Dict[str, List[str]]

# ---- Routes ----
@app.get("/", tags=["meta"])
def root() -> Dict[str, Any]:
    return {
        "name": "AI Financial News Summarizer API",
        "health": "/health",
        "docs": "/docs",
        "endpoints": ["/news/top-headlines", "/news/everything", "/summarize"],
        "cors_allowed": ALLOWED_ORIGINS,
    }

@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "newsapi_key_configured": bool(NEWSAPI_KEY),
        "openai_key_configured": bool(OPENAI_API_KEY),
    }

@app.get("/news/top-headlines")
async def top_headlines(
    country: str = Query("us", min_length=2, max_length=2, description="2-letter ISO code"),
    q: Optional[str] = Query(None, description="Search query"),
    pageSize: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="business, technology, etc."),
):
    if not NEWSAPI_KEY:
        raise HTTPException(status_code=500, detail="NEWSAPI_KEY not configured")

    params = {"apiKey": NEWSAPI_KEY, "country": country.lower(), "pageSize": pageSize}
    if q:
        params["q"] = q
    if category:
        params["category"] = category

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
    language: str = Query("en", pattern="^[a-z]{2}$"),
):
    if not NEWSAPI_KEY:
        raise HTTPException(status_code=500, detail="NEWSAPI_KEY not configured")

    params = {
        "apiKey": NEWSAPI_KEY,
        "q": q,
        "sortBy": sortBy,
        "pageSize": pageSize,
        "language": language,
    }

    async with httpx.AsyncClient(timeout=25) as client:
        r = await client.get(f"{NEWSAPI_BASE}/everything", params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return r.json()

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    # Build brief context from available fields (you can add scraping later)
    bits: List[str] = []
    if req.title:
        bits.append(f"Title: {req.title}")
    if req.content:
        bits.append(f"Content: {req.content}")
    if req.url:
        bits.append(f"URL: {req.url}")
    context = "\n".join(bits).strip() or "No content provided."

    prompt = (
        "You are an assistant that summarizes financial news for retail investors.\n"
        "Write a crisp 4–6 bullet summary focusing on:\n"
        "- What happened\n"
        "- Why it matters for markets\n"
        "- Any tickers explicitly mentioned\n"
        "- Risks/uncertainty\n\n"
        f"Text:\n{context}\n\n"
        "Return only the summary bullets (no preface)."
    )

    # cheap/fast model; switch to a larger model if you want richer output
    completion = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    summary = completion.choices[0].message.content.strip()

    # Sentiment (supports either float or str from your tagger)
    text_for_sent = ((req.title or "") + "\n" + (req.content or "")).strip()
    sent_result = analyze_sentiment(text_for_sent)
    if isinstance(sent_result, (int, float)):
        sentiment = "positive" if sent_result >= 0.05 else "negative" if sent_result <= -0.05 else "neutral"
    else:
        sentiment = str(sent_result).lower()

    tags = extract_tags(((req.title or "") + " " + (req.content or "")).strip())

    return {"summary": summary, "sentiment": sentiment, "tags": tags}
