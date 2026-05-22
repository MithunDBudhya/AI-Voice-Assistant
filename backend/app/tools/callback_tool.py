import json
import os
import uuid
from app.config import settings
from datetime import datetime

def book_callback(caller_phone: str, preferred_time: str, reason: str):
    file_path = os.path.join(settings.DATA_DIR, "callbacks.json")
    
    callbacks = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                callbacks = json.load(f)
            except:
                pass
                
    callback = {
        "callback_id": f"CB-{str(uuid.uuid4())[:8]}",
        "caller_phone": caller_phone,
        "preferred_time": preferred_time,
        "reason": reason,
        "status": "Pending",
        "timestamp": datetime.now().isoformat()
    }
    
    callbacks.append(callback)
    
    with open(file_path, "w") as f:
        json.dump(callbacks, f, indent=2)
        
    return callback
