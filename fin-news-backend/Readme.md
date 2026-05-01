# 🧠 AI Financial News Analyzer

A sleek React + FastAPI web app that helps you summarize financial news, detect sentiment, and extract tickers and sectors using AI. It also shows live financial headlines via NewsAPI.

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

## 🚀 Getting Started

### 1. Clone the Repository

git clone https://github.com/yourusername/ai-financial-news-analyzer.git
cd ai-financial-news-analyzer

## 2. Navigate to Backend Directory
cd backend

## 3. Install Python Dependencies
pip install -r requirements.txt

## 4. Run FastAPI Server

For mac - source venv/Scripts/activate 

For Windows - venv\Scripts\activate

uvicorn main:app --reload --port 8001
Runs at http://127.0.0.1:8001

🔑 API Keys Required
OpenAI API key → For summarization & tagging

NewsAPI key → For fetching live headlines

Store them securely inside:

.env (for backend)

Replace key string in frontend (App.jsx line with apiKey=...)