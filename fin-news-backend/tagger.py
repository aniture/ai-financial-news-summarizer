# fin-news-backend/tagger.py
import os
import nltk

# Make sure NLTK looks in the Render path (or local default)
NLTK_PATH = os.getenv("NLTK_DATA", "/opt/render/nltk_data")
nltk.data.path.append(NLTK_PATH)

# Ensure the VADER lexicon exists (no-op if already present)
try:
    nltk.data.find("sentiment/vader_lexicon")
except LookupError:
    os.makedirs(NLTK_PATH, exist_ok=True)
    nltk.download("vader_lexicon", download_dir=NLTK_PATH)

from nltk.sentiment import SentimentIntensityAnalyzer

sentiment_analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment(text: str) -> float:
    return sentiment_analyzer.polarity_scores(text)["compound"]


def extract_tags(text: str) -> list[str]:
    # your existing tagging logic (placeholder)
    return []
