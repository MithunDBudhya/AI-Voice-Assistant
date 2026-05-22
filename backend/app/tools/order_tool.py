import json
import os
from app.config import settings

def get_orders_data():
    file_path = os.path.join(settings.DATA_DIR, "orders.json")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    return []

def get_order_status(order_id: str):
    orders = get_orders_data()
    for order in orders:
        if order["order_id"] == order_id:
            return order
    return None
