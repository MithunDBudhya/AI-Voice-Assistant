import os
import json
from datetime import datetime
from app.config import settings

METADATA_FILE = os.path.join(settings.DATA_DIR, "policy_metadata.json")

def load_metadata() -> dict:
    if not os.path.exists(METADATA_FILE):
        return {}
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_metadata(meta: dict):
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

def register_policy_change(filename: str, file_path: str, content: str, comment: str = "Policy updated"):
    """Bumps version of policy and appends a log entry in metadata history."""
    meta = load_metadata()
    size = os.path.getsize(file_path) if os.path.exists(file_path) else len(content.encode("utf-8"))
    words = len(content.split())
    
    # Infer category from filename
    category = filename.replace("_policy", "").replace(".txt", "").replace(".pdf", "").replace(".docx", "").replace(".html", "").replace(".md", "").title()
    category = category.replace("-", " ").replace("_", " ")

    now_str = datetime.now().isoformat()

    if filename not in meta:
        meta[filename] = {
            "filename": filename,
            "category": category,
            "version": 1,
            "created_at": now_str,
            "last_updated": now_str,
            "size_bytes": size,
            "word_count": words,
            "status": "indexed",
            "history": [
                {
                    "version": 1,
                    "timestamp": now_str,
                    "comment": "Initial policy document creation",
                    "size_bytes": size,
                    "word_count": words
                }
            ]
        }
    else:
        current = meta[filename]
        next_ver = current.get("version", 1) + 1
        current["version"] = next_ver
        current["last_updated"] = now_str
        current["size_bytes"] = size
        current["word_count"] = words
        current["status"] = "indexed"
        
        if "history" not in current:
            current["history"] = []
            
        current["history"].append({
            "version": next_ver,
            "timestamp": now_str,
            "comment": comment,
            "size_bytes": size,
            "word_count": words
        })

    save_metadata(meta)

def delete_policy_metadata(filename: str):
    meta = load_metadata()
    if filename in meta:
        del meta[filename]
        save_metadata(meta)

def get_policy_history(filename: str) -> list:
    meta = load_metadata()
    if filename in meta:
        return meta[filename].get("history", [])
    return []
