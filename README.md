# 🧠 AI Financial News Analyzer

A sleek React + FastAPI web app that helps you summarize financial news, detect sentiment, and extract tickers and sectors using AI. It also shows live financial headlines via NewsAPI.

## 🔗 Live demo

[![Live demo](https://img.shields.io/badge/Live%20demo-ai--financial--news--summarizer.vercel.app-F5A623?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-financial-news-summarizer.vercel.app)

**<https://ai-financial-news-summarizer.vercel.app>**

The deployed build is the frontend on its own (no `VITE_API_URL`). Summarisation,
sentiment and tag extraction run as an in-browser stand-in for the FastAPI
service, and the headlines and quotes are a fixed sample set — so the demo needs
no keys and costs nothing to run. Point the frontend at the backend, as described
below, for live news and the real models. The status bar reads `live feed` or
`demo feed` so you can tell which you are looking at.

## ✨ Features

- Paste a story, or pick one from the wire, and get a summary, sentiment, and the tickers and sectors it names
- Live business headlines (NewsAPI) and a live quote tape (Finnhub), cached server-side
- Loading a live headline fetches the full article body, falling back to the feed's teaser
- Summaries from gpt-oss-20b via Groq; sentiment from NLTK VADER

## 🛠️ Stack

- **Frontend:** React 19, Vite, Tailwind 4 (`fin-news-frontend/`)
- **Backend:** FastAPI (`fin-news-backend/`)
- **Providers:** Groq (summaries, free tier), NewsAPI (headlines), Finnhub (quotes)

## 🚀 Running locally

### Backend

```bash
cd fin-news-backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                              # then fill in the three keys
uvicorn main:app --reload --port 8001
```

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | summaries (free key from console.groq.com) |
| `NEWSAPI_KEY` | headlines |
| `FINNHUB_API_KEY` | quote tape |
| `ALLOWED_ORIGINS` | comma-separated origins allowed by CORS |

A missing key makes that endpoint answer `503`; the frontend then shows the sample
feed for headlines and quotes, and an error for summaries. Keys live only in `.env`
(gitignored) locally and in the Render dashboard when deployed — never in the repo.

### Frontend

```bash
cd fin-news-frontend
cp .env.example .env      # VITE_API_URL=http://127.0.0.1:8001
npm install
npm run dev               # http://localhost:5173
```

Omit `VITE_API_URL` to run the keyless demo.

## 🔌 API

| Route | |
| --- | --- |
| `POST /summarize` `{content}` | `{summary}` |
| `POST /tag` `{content}` | `{sentiment, tags: {tickers, sectors}}` |
| `GET /headlines` | `{articles: [{title, description, source, url, publishedAt}]}` |
| `GET /quotes` | `{quotes: [{symbol, last, change}]}` |
| `POST /extract` `{url}` | `{content}` — only URLs previously served by `/headlines` |
