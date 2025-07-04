from fastapi import FastAPI, Request
from summarizer import summarize_article
from tagger import analyze_sentiment, extract_tags
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for tighter control
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Financial News Summarizer API"}

@app.post("/summarize")
async def summarize(request: Request):
    try:
        body = await request.json()
        content = body.get("content", "")
        print(f"Received content: {content}")  # DEBUG PRINT
        summary = summarize_article(content)
        return {"summary": summary}
    except Exception as e:
        print(f"Error during summarization: {e}")  # This will print in your terminal
        return {"error": "Something went wrong", "details": str(e)}


@app.post("/tag")
async def tag(request: Request):
    body = await request.json()
    content = body.get("content", "")
    sentiment = analyze_sentiment(content)
    tags = extract_tags(content)
    return {"sentiment": sentiment, "tags": tags}
