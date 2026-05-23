import os
import json
import time
import re
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings
import logging

logger = logging.getLogger(__name__)
_model = None
LOG_FILE = os.path.join(settings.DATA_DIR, "retrieval_logs.json")

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading SentenceTransformer model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def log_retrieval_query(query: str, best_source: str, confidence: float, latency_ms: float, hits: int):
    """Saves RAG queries to retrieval_logs.json for analytical dashboard insights."""
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except Exception:
            logs = []
            
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "source": best_source,
        "confidence": confidence,
        "latency_ms": latency_ms,
        "hits": hits
    })
    
    # Cap logs size to last 200 entries
    if len(logs) > 200:
        logs = logs[-200:]
        
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save retrieval logs: {e}")

from datetime import datetime

def query_expansion(query: str) -> str:
    """Expands query with relevant policy synonyms to boost hybrid retrieval."""
    expanded = query
    synonyms = {
        "prime": "prime benefits video music pricing subscription cost delivery early access fee",
        "refund": "refund timing credit account banking reversal money back return original method",
        "return": "return window packaging days replace labels exchange items fashion mobiles",
        "damage": "damaged broken cracked smashed transit screen box proof unboxing photos video",
        "cancel": "cancellation cancel pre-dispatch shipping status dispatch stop order refuse",
        "delay": "delivery delay delay transit logistics tracking late date extended coupon voucher",
        "lost": "lost package transit missing tracing tracking untraceable refund replacement search",
        "esc": "supervisor escalation manager support levels ticket transfer priority high tier"
    }
    
    query_lower = query.lower()
    for keyword, expansion in synonyms.items():
        if keyword in query_lower:
            expanded += " " + expansion
            
    return expanded

def compute_keyword_score(query: str, chunk: str) -> float:
    """Computes exact keyword match ratio using token overlaps."""
    # Clean and split into word tokens
    def get_tokens(text):
        return set(re.findall(r'[a-zA-Z0-9]+', text.lower()))
        
    q_tokens = get_tokens(query)
    doc_tokens = get_tokens(chunk)
    
    if not q_tokens:
        return 0.0
        
    intersection = q_tokens.intersection(doc_tokens)
    
    # Exact order number match or PIN code match boost
    order_pattern = re.compile(r'\b\d{3}-\d{7}-\d{7}\b')
    if order_pattern.search(query):
        order_match = order_pattern.search(query).group()
        if order_match in chunk:
            return 1.0
            
    return len(intersection) / len(q_tokens)

def query_knowledge_base(query_text: str, n_results: int = 3) -> dict:
    """
    Search the local vector DB for the most relevant policy documents.
    Uses Hybrid Search (Dense Embeddings + Keyword overlap reranking).
    Returns merged context from top-N results above confidence threshold.
    """
    t_start = time.time()
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    if not os.path.exists(db_path):
        logger.warning("RAG database not found. Run /rag/ingest first.")
        return None

    try:
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"Failed to read RAG database: {e}")
        return None

    documents = data.get("documents", [])
    metadatas = data.get("metadatas", [])
    embeddings = np.array(data.get("embeddings", []), dtype=np.float32)

    if not documents or len(embeddings) == 0:
        return None

    # Multi-query Expansion
    expanded_query = query_expansion(query_text)

    # Compute query embedding
    t0 = time.time()
    model = get_model()
    query_embedding = model.encode([expanded_query])[0].astype(np.float32)
    t1 = time.time()
    embedding_time_ms = round((t1 - t0) * 1000, 1)

    # Compute Cosine Similarity
    t2 = time.time()
    norms = np.linalg.norm(embeddings, axis=1)
    query_norm = np.linalg.norm(query_embedding)
    if query_norm == 0 or np.any(norms == 0):
        semantic_similarities = np.zeros(len(documents))
    else:
        semantic_similarities = np.dot(embeddings, query_embedding) / (norms * query_norm)

    # Hybrid Search Scoring: 70% Semantic + 30% Keyword Matching
    hybrid_scores = []
    for i, doc in enumerate(documents):
        kw_score = compute_keyword_score(query_text, doc)
        sem_score = float(semantic_similarities[i])
        # Combine
        combined = (0.7 * sem_score) + (0.3 * kw_score)
        # Cap combined score
        hybrid_scores.append(max(0.0, min(1.0, combined)))

    hybrid_scores = np.array(hybrid_scores, dtype=np.float32)

    # Rerank indices based on combined hybrid score
    top_indices = np.argsort(hybrid_scores)[::-1][:n_results]
    
    # Target confidence threshold
    THRESHOLD = 0.30
    
    matches = [
        {
            "source": metadatas[int(i)].get("source", "unknown"),
            "score": round(float(hybrid_scores[i]), 3),
            "text": documents[int(i)],
            "category": metadatas[int(i)].get("category", "General"),
            "version": metadatas[int(i)].get("version", "v1")
        }
        for i in top_indices
    ]

    filtered_results = [
        (int(i), float(hybrid_scores[i]), documents[i], metadatas[i])
        for i in top_indices
        if hybrid_scores[i] >= THRESHOLD
    ]
    t3 = time.time()
    search_time_ms = round((t3 - t2) * 1000, 1)
    
    total_latency_ms = round((time.time() - t_start) * 1000, 1)

    query_vector_slice = [round(float(x), 4) for x in query_embedding[:5]]

    # Log query events for analytics dashboards
    best_source = metadatas[int(top_indices[0])].get("source", "none") if len(top_indices) > 0 else "none"
    best_score = float(hybrid_scores[top_indices[0]]) if len(top_indices) > 0 else 0.0
    log_retrieval_query(query_text, best_source, best_score, total_latency_ms, len(filtered_results))

    if not filtered_results:
        return {
            "answer_context": "",
            "source": "none",
            "confidence": best_score,
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
        "sources": list(set(meta.get("source") for _, _, _, meta in filtered_results)),
        "matches": matches,
        "embedding_time_ms": embedding_time_ms,
        "search_time_ms": search_time_ms,
        "query_vector": query_vector_slice
    }
