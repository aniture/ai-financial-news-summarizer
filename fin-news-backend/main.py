import logging
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

import news  # noqa: E402  (needs env loaded first)
from summarizer import summarize_article  # noqa: E402
from tagger import analyze_sentiment, extract_tags  # noqa: E402

log = logging.getLogger("tape-reader")

app = FastAPI()

# No credentials are used, so a wildcard is acceptable as a fallback, but the
# deployed value should list the real origins.
_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class Article(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


class ExtractRequest(BaseModel):
    url: str


@app.get("/")
def root():
    return {"message": "Financial News Summarizer API"}


@app.post("/summarize")
def summarize(body: Article):
    try:
        return {"summary": summarize_article(body.content)}
    except RuntimeError as e:  # missing key
        raise HTTPException(503, str(e))
    except Exception:
        log.exception("summarization failed")
        raise HTTPException(502, "Summarization failed")


@app.post("/tag")
def tag(body: Article):
    return {"sentiment": analyze_sentiment(body.content), "tags": extract_tags(body.content)}


@app.get("/headlines")
async def get_headlines():
    try:
        return {"articles": await news.headlines()}
    except news.NotConfigured as e:
        raise HTTPException(503, str(e))
    except httpx.HTTPError:
        log.exception("headlines fetch failed")
        raise HTTPException(502, "Headlines provider unavailable")


@app.get("/quotes")
async def get_quotes():
    try:
        return {"quotes": await news.quotes()}
    except news.NotConfigured as e:
        raise HTTPException(503, str(e))
    except (httpx.HTTPError, RuntimeError):
        log.exception("quotes fetch failed")
        raise HTTPException(502, "Quotes provider unavailable")


@app.post("/extract")
async def extract(body: ExtractRequest):
    try:
        text = await news.extract(body.url)
    except news.UnknownArticle:
        raise HTTPException(400, "URL was not served by /headlines")
    except httpx.HTTPError:
        raise HTTPException(502, "Could not fetch the article")
    if not text:
        raise HTTPException(422, "No article text found")
    return {"content": text}
