FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for sentence-transformers and chromadb
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model if needed, or let sentence-transformers download on first run
# but better to do it during build so it's faster at startup
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

# Ingest data during build or start (Optional: We expose /rag/ingest for manual trigger)
# But it's good to have basic ingest at startup
# RUN python -m app.rag.ingest

# Port is provided by Render
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
