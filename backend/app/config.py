import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./chroma_db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    PORT: int = int(os.getenv("PORT", 8000))
    MAX_CALLS_LOG: int = int(os.getenv("MAX_CALLS_LOG", 200))
    VAPI_WEBHOOK_SECRET: str = os.getenv("VAPI_WEBHOOK_SECRET", "")
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
    KNOWLEDGE_BASE_DIR: str = os.path.join(os.path.dirname(__file__), "rag", "knowledge_base")

settings = Settings()
