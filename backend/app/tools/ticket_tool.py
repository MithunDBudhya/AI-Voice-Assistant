import json
import os
import uuid
from app.config import settings
from datetime import datetime

def create_ticket(caller_phone: str, reason: str, priority: str, transcript: str):
    file_path = os.path.join(settings.DATA_DIR, "tickets.json")
    
    tickets = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                tickets = json.load(f)
            except:
                pass
                
    ticket = {
        "ticket_id": f"TKT-{str(uuid.uuid4())[:8]}",
        "caller_phone": caller_phone,
        "reason": reason,
        "priority": priority,
        "transcript": transcript,
        "status": "Open",
        "timestamp": datetime.now().isoformat()
    }
    
    tickets.append(ticket)
    
    with open(file_path, "w") as f:
        json.dump(tickets, f, indent=2)
        
    return ticket
