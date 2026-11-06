import os

import openai

# Groq serves an OpenAI-compatible API on a free tier. Override the model with
# SUMMARIZER_MODEL if this one is retired.
BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "openai/gpt-oss-20b"

_client = None


def _get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = openai.OpenAI(api_key=api_key, base_url=BASE_URL)
    return _client


def summarize_article(content: str) -> str:
    prompt = (
        "Summarize the following financial news article in at most three "
        "sentences. State what happened, the numbers involved, and why it "
        "matters to investors. Reply with the summary only.\n\n"
        f"{content}"
    )
    response = _get_client().chat.completions.create(
        model=os.getenv("SUMMARIZER_MODEL", DEFAULT_MODEL),
        messages=[{"role": "user", "content": prompt}],
        # gpt-oss reasons before answering; keep that short and leave headroom,
        # or the budget is spent thinking and the summary comes back empty.
        reasoning_effort="low",
        max_completion_tokens=800,
        temperature=0.3,
    )
    summary = (response.choices[0].message.content or "").strip()
    if not summary:
        raise ValueError("model returned an empty summary")
    return summary
