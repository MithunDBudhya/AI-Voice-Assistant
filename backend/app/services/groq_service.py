from groq import Groq
from app.config import settings

def generate_response(prompt: str, system_message: str = "You are a helpful AI support agent."):
    if not settings.GROQ_API_KEY:
        # Fallback if no key is provided
        return None

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=150,
            temperature=0.3
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return None
