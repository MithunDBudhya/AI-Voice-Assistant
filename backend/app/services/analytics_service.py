import json
import os
from app.config import settings

def get_dashboard_summary():
    # Helper to load counts
    def count_items(filename):
        path = os.path.join(settings.DATA_DIR, filename)
        if os.path.exists(path):
            with open(path, "r") as f:
                try:
                    return len(json.load(f))
                except:
                    pass
        return 0

    total_calls = count_items("calls.json")
    escalated_calls = count_items("tickets.json")
    pending_callbacks = count_items("callbacks.json")
    
    # Mocking some metrics based on available data for demo
    resolved_calls = total_calls - escalated_calls
    resolution_rate = f"{int((resolved_calls / total_calls * 100))}%" if total_calls > 0 else "0%"
    avg_response_time = "1.2s"

    return {
        "total_calls": total_calls,
        "resolved_calls": resolved_calls,
        "escalated_calls": escalated_calls,
        "pending_callbacks": pending_callbacks,
        "resolution_rate": resolution_rate,
        "average_response_time": avg_response_time
    }

def get_calls():
    path = os.path.join(settings.DATA_DIR, "calls.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            try:
                return json.load(f)
            except:
                pass
    return []

def get_tickets():
    path = os.path.join(settings.DATA_DIR, "tickets.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            try:
                return json.load(f)
            except:
                pass
    return []

def get_callbacks():
    path = os.path.join(settings.DATA_DIR, "callbacks.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            try:
                return json.load(f)
            except:
                pass
    return []
