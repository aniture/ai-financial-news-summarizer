# No NLTK needed; vaderSentiment bundles the lexicon
print(">>> USING TAGGER: vaderSentiment build")

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str) -> float:
    """Return compound sentiment score (-1..1)."""
    text = text or ""
    return _analyzer.polarity_scores(text)["compound"]

def extract_tags(text: str) -> list[str]:
    # TODO: keep/replace with your real tag extraction
    return []
