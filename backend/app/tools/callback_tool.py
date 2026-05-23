import json
import os
import uuid
from app.config import settings
from datetime import datetime


def book_callback(caller_phone: str, preferred_time: str, reason: str) -> dict:
    """Schedule a callback and persist it."""
    file_path = os.path.join(settings.DATA_DIR, "callbacks.json")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    callbacks = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                callbacks = json.load(f)
            except Exception:
                callbacks = []

    callback = {
        "callback_id": f"CB-{str(uuid.uuid4())[:8].upper()}",
        "caller_phone": caller_phone,
        "preferred_time": preferred_time,
        "reason": reason,
        "status": "Pending",
        "assigned_agent": None,
        "completed_at": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "timestamp": datetime.now().isoformat(),
    }

    callbacks.append(callback)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(callbacks, f, indent=2, ensure_ascii=False)

    return callback


def update_callback_status(callback_id: str, status: str) -> dict:
    """Update a callback's status (e.g., Pending → Completed)."""
    file_path = os.path.join(settings.DATA_DIR, "callbacks.json")
    callbacks = []

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                callbacks = json.load(f)
            except Exception:
                return None

    for cb in callbacks:
        if cb.get("callback_id") == callback_id:
            cb["status"] = status
            cb["updated_at"] = datetime.now().isoformat()
            if status == "Completed":
                cb["completed_at"] = datetime.now().isoformat()
            break
    else:
        return None

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(callbacks, f, indent=2, ensure_ascii=False)

    return next((c for c in callbacks if c.get("callback_id") == callback_id), None)
