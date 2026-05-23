import os
import json
from sentence_transformers import SentenceTransformer
from app.config import settings

def ingest_documents():
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    if not os.path.exists(docs_dir):
        return
        
    documents = []
    metadatas = []
    
    for filename in os.listdir(docs_dir):
        if filename.endswith(".txt"):
            file_path = os.path.join(docs_dir, filename)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    # Split into sections based on double newlines
                    chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
                    for chunk in chunks:
                        documents.append(chunk)
                        metadatas.append({"source": filename})
                    
    if not documents:
        return

    # Load model and compute embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(documents).tolist()
    
    # Save to a simple JSON file
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    with open(db_path, "w") as f:
        json.dump({
            "documents": documents,
            "metadatas": metadatas,
            "embeddings": embeddings
        }, f)

if __name__ == "__main__":
    ingest_documents()
    print("Ingestion complete.")
