import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def query_knowledge_base(query_text: str, n_results: int = 1):
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    if not os.path.exists(db_path):
        return None
        
    with open(db_path, "r") as f:
        data = json.load(f)
        
    documents = data.get("documents", [])
    metadatas = data.get("metadatas", [])
    embeddings = np.array(data.get("embeddings", []))
    
    if not documents or len(embeddings) == 0:
        return None
        
    # Get query embedding
    m = get_model()
    query_embedding = m.encode([query_text])[0]
    
    # Compute cosine similarities
    similarities = np.dot(embeddings, query_embedding) / (np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding))
    
    # Get top match
    best_idx = np.argmax(similarities)
    best_score = similarities[best_idx]
    
    # Simple threshold
    if best_score < 0.2:
        return None
        
    return {
        "answer_context": documents[best_idx],
        "source": metadatas[best_idx].get("source", "unknown"),
        "confidence": float(best_score)
    }
