import openai

client = openai.OpenAI(
    api_key="c358171e697af969bfd719d4df8a87437de5433dd6eb9ec779ece266c858f7e3", 
    base_url="https://api.together.xyz/v1"
)

def summarize_article(content: str) -> str:
    prompt = f"Summarize the following financial news article:\n\n{content}"
    response = client.chat.completions.create(
        model="mistralai/Mixtral-8x7B-Instruct-v0.1",  # Choose from their supported models
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()




    