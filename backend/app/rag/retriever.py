import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings
import logging

logger = logging.getLogger(__name__)
_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading SentenceTransformer model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def query_knowledge_base(query_text: str, n_results: int = 3) -> dict:
    """
    Search the local vector DB for the most relevant policy documents.
    Returns merged context from top-N results above confidence threshold.
    """
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    if not os.path.exists(db_path):
        logger.warning("RAG database not found. Run /rag/ingest first.")
        return None

    with open(db_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    documents = data.get("documents", [])
    metadatas = data.get("metadatas", [])
    embeddings = np.array(data.get("embeddings", []), dtype=np.float32)

    if not documents or len(embeddings) == 0:
        return None

    # Compute query embedding
    import time
    t0 = time.time()
    model = get_model()
    query_embedding = model.encode([query_text])[0].astype(np.float32)
    t1 = time.time()
    embedding_time_ms = round((t1 - t0) * 1000, 1)

    # Cosine similarity
    t2 = time.time()
    norms = np.linalg.norm(embeddings, axis=1)
    query_norm = np.linalg.norm(query_embedding)
    if query_norm == 0 or np.any(norms == 0):
        return None

    similarities = np.dot(embeddings, query_embedding) / (norms * query_norm)

    # Get top-N above threshold
    THRESHOLD = 0.30
    top_indices = np.argsort(similarities)[::-1][:n_results]
    
    matches = [
        {
            "source": metadatas[int(i)].get("source", "unknown"),
            "score": round(float(similarities[i]), 3),
            "text": documents[int(i)]
        }
        for i in top_indices
    ]

    filtered_results = [
        (int(i), float(similarities[i]), documents[i], metadatas[i])
        for i in top_indices
        if similarities[i] >= THRESHOLD
    ]
    t3 = time.time()
    search_time_ms = round((t3 - t2) * 1000, 1)

    query_vector_slice = [round(float(x), 4) for x in query_embedding[:5]]

    if not filtered_results:
        # Return trace anyway for observability explainer mode
        return {
            "answer_context": "",
            "source": "none",
            "confidence": float(similarities[top_indices[0]]) if len(top_indices) > 0 else 0.0,
            "sources": [],
            "matches": matches,
            "embedding_time_ms": embedding_time_ms,
            "search_time_ms": search_time_ms,
            "query_vector": query_vector_slice
        }

    # Merge contexts from top results
    best_idx, best_score, best_doc, best_meta = filtered_results[0]
    merged_context = " ".join(doc for _, _, doc, _ in filtered_results[:2])

    return {
        "answer_context": merged_context.strip(),
        "source": best_meta.get("source", "unknown"),
        "confidence": best_score,
        "sources": [meta.get("source") for _, _, _, meta in filtered_results],
        "matches": matches,
        "embedding_time_ms": embedding_time_ms,
        "search_time_ms": search_time_ms,
        "query_vector": query_vector_slice
    }
