from groq import Groq
from app.config import settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

def generate_response(
    prompt: str,
    system_message: str = "You are a helpful AI support agent.",
    conversation_history: Optional[List[Dict]] = None
) -> Optional[str]:
    """
    Generate a response using the Groq LLM.
    
    Args:
        prompt: The user's current message
        system_message: The system prompt with context
        conversation_history: Optional list of prior {role, content} messages for session memory
    
    Returns:
        Generated text response or None on failure
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — using deterministic fallback")
        return None

    import time
    t0 = time.time()
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        messages = [{"role": "system", "content": system_message}]

        # Add conversation history for session continuity
        if conversation_history:
            messages.extend(conversation_history[-6:])  # Keep last 3 exchanges (6 messages)

        messages.append({"role": "user", "content": prompt})

        chat_completion = client.chat.completions.create(
            messages=messages,
            model=settings.GROQ_MODEL,
            max_tokens=180,
            temperature=0.3
        )
        t1 = time.time()
        latency_ms = round((t1 - t0) * 1000, 1)

        content = chat_completion.choices[0].message.content.strip()
        usage = chat_completion.usage

        return {
            "answer": content,
            "prompt_tokens": usage.prompt_tokens if usage else 0,
            "completion_tokens": usage.completion_tokens if usage else 0,
            "total_tokens": usage.total_tokens if usage else 0,
            "model": settings.GROQ_MODEL,
            "latency_ms": latency_ms
        }

    except Exception as e:
        logger.error(f"Groq API Error: {e}")
        return {
            "answer": None,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "model": settings.GROQ_MODEL,
            "latency_ms": 0.0
        }
