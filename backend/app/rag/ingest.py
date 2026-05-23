import os
import json
import logging
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.rag.parser import extract_text_from_file
from app.rag.history import register_policy_change, load_metadata
from app.rag.default_policies import write_default_policies

logger = logging.getLogger(__name__)

def chunk_text(text: str, max_chars: int = 600, overlap: int = 150) -> list:
    """
    Split text into overlapping chunks.
    Tries to split on paragraph/sentence boundaries to maintain context.
    """
    if not text:
        return []
        
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    
    for para in paragraphs:
        if len(para) <= max_chars:
            chunks.append(para)
        else:
            # Sentence split fallback for long paragraphs
            sentences = re_split_sentences(para)
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= max_chars:
                    current_chunk += " " + sentence if current_chunk else sentence
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    # Overlap handling: start next chunk with trailing part of previous
                    words = current_chunk.split()
                    overlap_words = words[-max(1, len(words) // 4):] # use trailing 25% words
                    current_chunk = " ".join(overlap_words) + " " + sentence
            if current_chunk:
                chunks.append(current_chunk.strip())
                
    # Safeguard against too small chunks
    merged_chunks = []
    for chunk in chunks:
        if not merged_chunks:
            merged_chunks.append(chunk)
        else:
            if len(merged_chunks[-1]) + len(chunk) < max_chars - overlap:
                merged_chunks[-1] += " " + chunk
            else:
                merged_chunks.append(chunk)
                
    return merged_chunks

def re_split_sentences(text: str) -> list:
    # A simple regex sentence splitter that matches terminal punctuations followed by spaces
    sentence_end = re.compile(r'(?<=[.!?])\s+')
    return sentence_end.split(text)

import re

def ingest_documents(force_rebuild: bool = False):
    """
    Scans the knowledge base directory, parses all TXT, MD, HTML, PDF, and DOCX files,
    creates semantic overlapping chunks, computes dense vectors, and saves to simple_rag_db.json.
    """
    # 1. Pre-populate default policies if empty
    write_default_policies()
    
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    if not os.path.exists(docs_dir):
        os.makedirs(docs_dir, exist_ok=True)
        return
        
    documents = []
    metadatas = []
    
    logger.info("Scanning knowledge base files for ingestion...")
    files = os.listdir(docs_dir)
    
    # Supported file endings
    supported_extensions = (".txt", ".md", ".markdown", ".html", ".htm", ".pdf", ".docx")
    
    for filename in files:
        if filename.lower().endswith(supported_extensions):
            file_path = os.path.join(docs_dir, filename)
            try:
                # Extract text using format-specific parsers
                content = extract_text_from_file(file_path)
                if not content:
                    continue
                
                # Check / register in metadata version tracker
                meta = load_metadata()
                if filename not in meta:
                    register_policy_change(filename, file_path, content, "Initial document registration")
                
                # Retrieve current metadata values
                meta = load_metadata()
                doc_meta = meta.get(filename, {})
                version = doc_meta.get("version", 1)
                category = doc_meta.get("category", "General")
                
                # Split text into chunks
                chunks = chunk_text(content)
                for idx, chunk in enumerate(chunks):
                    documents.append(chunk)
                    metadatas.append({
                        "source": filename,
                        "category": category,
                        "version": f"v{version}",
                        "chunk_index": idx
                    })
            except Exception as e:
                logger.error(f"Failed to ingest file {filename}: {e}")
                
    if not documents:
        logger.warning("No documents found to index.")
        return

    logger.info(f"Computing embeddings for {len(documents)} text chunks...")
    
    # 2. Encode documents and generate embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(documents).tolist()
    
    # 3. Save index to database file
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump({
            "documents": documents,
            "metadatas": metadatas,
            "embeddings": embeddings
        }, f)
        
    logger.info("RAG synchronization complete.")

if __name__ == "__main__":
    ingest_documents()
    print("Ingestion complete.")
