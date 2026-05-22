import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./chroma_db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    PORT: int = int(os.getenv("PORT", 8000))
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
    KNOWLEDGE_BASE_DIR: str = os.path.join(os.path.dirname(__file__), "rag", "knowledge_base")

settings = Settings()
