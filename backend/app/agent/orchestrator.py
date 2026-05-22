import json
import os
import uuid
from datetime import datetime
from app.config import settings
from app.agent.intent_classifier import detect_intent, detect_sentiment, extract_order_id
from app.agent.prompts import get_system_prompt
from app.services.groq_service import generate_response
from app.tools.order_tool import get_order_status
from app.tools.ticket_tool import create_ticket
from app.tools.callback_tool import book_callback
from app.tools.rag_tool import rag_query

def handle_call(caller_phone: str, message: str) -> dict:
    call_id = f"call_{str(uuid.uuid4())[:8]}"
    intent = detect_intent(message)
    sentiment = detect_sentiment(message)
    
    tool_used = "none"
    source = None
    escalated = False
    context = ""
    answer = ""
    
    # Check for direct escalation based on sentiment
    if sentiment == "frustrated" and intent != "HUMAN_ESCALATION":
        intent = "HUMAN_ESCALATION"
    
    if intent == "ORDER_STATUS":
        order_id = extract_order_id(message)
        if order_id:
            tool_used = "get_order_status"
            order_data = get_order_status(order_id)
            if order_data:
                source = "orders.json"
                context = f"Order {order_id} status: {order_data['status']}. Delivery: {order_data['expected_delivery']}."
                # Deterministic fallback
                answer = f"Your order {order_id} is {order_data['status']} and is expected {order_data['expected_delivery'].lower()}."
            else:
                context = f"Order {order_id} not found."
                answer = f"I couldn't find order {order_id}. Could you please check the number?"
        else:
            answer = "Could you please provide your 4-digit order number so I can check the status?"
            
    elif intent == "FAQ_POLICY":
        tool_used = "rag_query"
        rag_result = rag_query(message)
        if rag_result:
            context = rag_result["answer_context"]
            source = rag_result["source"]
            # Fallback deterministic based on source
            if "refund" in source.lower():
                answer = "You can request a refund within 7 days of delivery if the product is unused. It takes 3 to 5 working days to process."
            elif "delivery" in source.lower():
                answer = "Standard delivery takes 3 to 5 working days."
            else:
                answer = "Let me check that policy for you. Could you hold on a moment?"
        else:
            context = "Policy not found."
            answer = "I'm sorry, I don't have that information right now. Our support team will follow up with you."
            
    elif intent == "HUMAN_ESCALATION":
        tool_used = "create_ticket"
        create_ticket(caller_phone, "Customer requested human escalation", "High", message)
        escalated = True
        answer = "I apologize for the frustration. I have created a high-priority ticket and our manager will contact you shortly."
        
    elif intent == "BOOK_CALLBACK":
        tool_used = "book_callback"
        # Naive extraction for demo
        preferred_time = "tomorrow morning" if "morning" in message.lower() else "soon"
        book_callback(caller_phone, preferred_time, "Customer requested a callback")
        answer = f"I have scheduled a callback for you for {preferred_time}. Our team will speak with you then."
        
    else:
        answer = "I can help you track an order, check our policies, or arrange a callback. How can I assist you today?"

    # Always use LLM to translate or naturalize the response
    system_prompt = get_system_prompt(intent, context)
    llm_answer = generate_response(prompt=message, system_message=system_prompt)
        
    if llm_answer:
        # Basic cleanup
        answer = llm_answer.replace("*", "").replace("\n", " ").strip()

    # Log the call
    log_call({
        "call_id": call_id,
        "caller_phone": caller_phone,
        "message": message,
        "intent": intent,
        "sentiment": sentiment,
        "tool_used": tool_used,
        "source": source,
        "escalated": escalated,
        "answer": answer,
        "timestamp": datetime.now().isoformat()
    })

    return {
        "call_id": call_id,
        "intent": intent,
        "sentiment": sentiment,
        "tool_used": tool_used,
        "answer": answer,
        "source": source,
        "escalated": escalated,
        "summary": f"Customer asked about {intent.lower()}.",
        "timestamp": datetime.now().isoformat()
    }

def log_call(call_data: dict):
    file_path = os.path.join(settings.DATA_DIR, "calls.json")
    calls = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try:
                calls = json.load(f)
            except:
                pass
                
    calls.insert(0, call_data)  # Add to top
    
    with open(file_path, "w") as f:
        json.dump(calls, f, indent=2)
