# 🧠 AI Financial News Analyzer

A sleek React + FastAPI web app that helps you summarize financial news, detect sentiment, and extract tickers and sectors using AI. It also shows live financial headlines via NewsAPI.

## 🔗 Live demo

[![Live demo](https://img.shields.io/badge/Live%20demo-ai--financial--news--summarizer.vercel.app-F5A623?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-financial-news-summarizer.vercel.app)

**<https://ai-financial-news-summarizer.vercel.app>**

The deployed build is the frontend on its own. Summarisation, sentiment and tag
extraction run as an in-browser stand-in for the FastAPI service, and the
headlines are a fixed sample set rather than a live NewsAPI feed — so the demo
needs no keys and costs nothing to run. Start the Python backend as described
below to use the real models.

## ✨ Features

- 💡 Paste or click headlines to analyze financial news using AI
- 🧠 Summary, sentiment & tag extraction from a Python backend (FastAPI)
- 📰 Real-time top business headlines (NewsAPI)
- 🌗 Light/Dark mode toggle with modern UI
- 🎨 Animated cards, interactive button with spinner
- 🖼️ Image thumbnails for headlines with hover glow

---

## 🛠️ Technologies Used

- **Frontend:** React, CSS3
- **Backend:** FastAPI (Python)
- **APIs:** OpenAI (for NLP), NewsAPI (for headlines)

---

## 🚀 Getting Started - Frontend

### 1. Clone the Repository

git clone https://github.com/yourusername/ai-financial-news-analyzer.git
cd ai-financial-news-analyzer

## 2. Install Frontend Dependencies
npm install

## 3. Start the React App
npm start
Runs at http://localhost:3000

---
## 🚀 Getting Started - Backend

### 1. Clone the Repository

git clone https://github.com/yourusername/ai-financial-news-analyzer.git
cd ai-financial-news-analyzer

## 2. Navigate to Backend Directory
cd backend

## 3. Install Python Dependencies
pip install -r requirements.txt

## 4. Run FastAPI Server

venv\Scripts\activate

uvicorn main:app --reload --port 8001
Runs at http://127.0.0.1:8001

🔑 API Keys Required
OpenAI API key → For summarization & tagging

NewsAPI key → For fetching live headlines

Store them securely inside:

.env (for backend)

Replace key string in frontend (App.jsx line with apiKey=...)
