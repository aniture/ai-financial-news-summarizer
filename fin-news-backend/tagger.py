import re

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Ensure the vader_lexicon resource is available; download if missing.
try:
    sentiment_analyzer = SentimentIntensityAnalyzer()
except LookupError:
    nltk.download("vader_lexicon")
    sentiment_analyzer = SentimentIntensityAnalyzer()

# Symbols we recognise when they appear as bare uppercase words. Short or
# common-word symbols (V, MA, BRK) are only matched in cashtag form ($V).
TICKERS = {
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "NVDA", "TSLA", "AMD",
    "INTC", "AVGO", "ORCL", "CRM", "NFLX", "ADBE", "QCOM", "TSM", "JPM",
    "BAC", "WFC", "GS", "MS", "C", "BRK.B", "V", "MA", "PYPL", "WMT", "COST",
    "TGT", "HD", "NKE", "MCD", "SBUX", "XOM", "CVX", "COP", "PFE", "JNJ",
    "MRK", "LLY", "UNH", "ABBV", "BA", "GM", "F", "DIS", "UBER",
}
AMBIGUOUS_TICKERS = {"V", "MA", "C", "F", "GS", "MS", "HD", "GM", "CRM"}

SECTORS = {
    "technology", "healthcare", "finance", "energy", "automotive", "retail",
    "banking", "semiconductors", "ai", "real estate", "utilities", "telecom",
    "consumer", "industrials", "materials", "crypto",
}

_CASHTAG = re.compile(r"\$([A-Z]{1,5}(?:\.[A-Z])?)\b")
_WORD = re.compile(r"\b[A-Z]{1,5}(?:\.[A-Z])?\b")


def analyze_sentiment(text: str) -> str:
    score = sentiment_analyzer.polarity_scores(text)["compound"]
    if score >= 0.05:
        return "positive"
    elif score <= -0.05:
        return "negative"
    return "neutral"


def extract_tags(text: str):
    found = []

    def add(symbol: str) -> None:
        if symbol in TICKERS and symbol not in found:
            found.append(symbol)

    # Cashtags win over everything and may name ambiguous symbols.
    for m in _CASHTAG.finditer(text):
        add(m.group(1))
    # Bare uppercase words, in order of appearance, skipping ambiguous ones.
    for m in _WORD.finditer(text):
        if m.group(0) not in AMBIGUOUS_TICKERS:
            add(m.group(0))

    lower = text.lower()
    found_sectors = [s for s in sorted(SECTORS) if re.search(rf"\b{re.escape(s)}\b", lower)]

    return {"tickers": found, "sectors": found_sectors}
