from nltk.sentiment.vader import SentimentIntensityAnalyzer

sentiment_analyzer = SentimentIntensityAnalyzer()

tickers = {"AAPL", "GOOGL", "AMZN", "TSLA"}
sectors = {"technology", "healthcare", "finance", "energy", "automotive"}

def analyze_sentiment(text: str) -> str:
    score = sentiment_analyzer.polarity_scores(text)['compound']
    if score >= 0.05:
        return "positive"
    elif score <= -0.05:
        return "negative"
    return "neutral"

def extract_tags(text: str):
    text_upper = text.upper()
    text_lower = text.lower()

    found_tickers = [t for t in tickers if t in text_upper]
    found_sectors = [s for s in sectors if s in text_lower]

    return {
        "tickers": found_tickers,
        "sectors": found_sectors
    }

