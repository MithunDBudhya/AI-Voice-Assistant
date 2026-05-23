import json
import os
import uuid
from app.config import settings
from datetime import datetime


def create_ticket(caller_phone: str, reason: str, priority: str, transcript: str) -> dict:
    """Create and persist a support ticket."""
    file_path = os.path.join(settings.DATA_DIR, "tickets.json")
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    tickets = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                tickets = json.load(f)
            except Exception:
                tickets = []

    ticket = {
        "ticket_id": f"TKT-{str(uuid.uuid4())[:8].upper()}",
        "caller_phone": caller_phone,
        "reason": reason,
        "priority": priority,
        "transcript": transcript,
        "status": "Open",
        "assigned_to": None,
        "resolution_notes": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "timestamp": datetime.now().isoformat(),
    }

    tickets.append(ticket)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)

    return ticket


def update_ticket_status(ticket_id: str, status: str, resolution_notes: str = None) -> dict:
    """Update an existing ticket's status."""
    file_path = os.path.join(settings.DATA_DIR, "tickets.json")
    tickets = []

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                tickets = json.load(f)
            except Exception:
                return None

    for ticket in tickets:
        if ticket.get("ticket_id") == ticket_id:
            ticket["status"] = status
            ticket["updated_at"] = datetime.now().isoformat()
            if resolution_notes:
                ticket["resolution_notes"] = resolution_notes
            break
    else:
        return None  # Not found

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)

    return next((t for t in tickets if t.get("ticket_id") == ticket_id), None)
