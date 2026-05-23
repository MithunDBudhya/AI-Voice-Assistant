import json
import os
import uuid
import time
from datetime import datetime
from typing import List, Dict, Optional

from app.config import settings
from app.agent.intent_classifier import detect_intent, detect_sentiment, extract_order_id
from app.agent.prompts import get_system_prompt
from app.services.groq_service import generate_response
from app.tools.order_tool import get_order_status, get_orders_data
from app.tools.ticket_tool import create_ticket
from app.tools.callback_tool import book_callback
from app.tools.rag_tool import rag_query

# In-memory session store: { caller_phone: [{"role": ..., "content": ...}] }
_sessions: Dict[str, List[Dict]] = {}


def handle_call(caller_phone: str, message: str) -> dict:
    """
    Main AI orchestrator. Processes a customer message and returns a structured response.
    Tracks response time, session memory, sentiment score, and all tool calls.
    """
    call_id = f"call_{str(uuid.uuid4())[:8]}"
    start_time = time.time()

    # Classify intent and sentiment (with confidence scores)
    intent, intent_confidence = detect_intent(message)
    sentiment_label, sentiment_score = detect_sentiment(message)

    tool_used = "none"
    tool_inputs = {}
    tool_outputs = {}
    source = None
    escalated = False
    context = ""
    answer = ""

    # Observability tracking & RAG query execution (runs once per call for tracing)
    rag_telemetry = {
        "embedding_time_ms": 0.0,
        "search_time_ms": 0.0,
        "matches": [],
        "query_vector": []
    }
    
    rag_result = rag_query(message)
    if rag_result:
        rag_telemetry["embedding_time_ms"] = rag_result.get("embedding_time_ms", 0.0)
        rag_telemetry["search_time_ms"] = rag_result.get("search_time_ms", 0.0)
        rag_telemetry["matches"] = rag_result.get("matches", [])
        rag_telemetry["query_vector"] = rag_result.get("query_vector", [])

    # Auto-escalate frustrated customers with high frustration score
    if sentiment_label == "frustrated" and sentiment_score >= 0.7 and intent not in ("HUMAN_ESCALATION", "COMPLAINT_REGISTRATION"):
        intent = "HUMAN_ESCALATION"

    # ── Tool Routing ─────────────────────────────────────────
    if intent == "ORDER_STATUS":
        order_id = extract_order_id(message)
        if order_id:
            tool_used = "get_order_status"
            tool_inputs = {"order_id": order_id}
            order_data = get_order_status(order_id)
            tool_outputs = order_data if order_data else {"error": "Order not found"}
            if order_data:
                source = "orders.json"
                context = (
                    f"Order {order_id} belongs to {order_data.get('customer_name', 'customer')}. "
                    f"Product: {order_data.get('product', 'N/A')}. "
                    f"Status: {order_data['status']}. "
                    f"Courier: {order_data.get('courier', 'ATS (Amazon Transportation Services)')}. "
                    f"Delivery: {order_data['expected_delivery']}."
                )
                answer = (
                    f"Your order {order_id} for the {order_data.get('product', 'item')} "
                    f"is currently {order_data['status'].lower()} via {order_data.get('courier', 'ATS')} "
                    f"and is expected {order_data['expected_delivery'].lower()}."
                )
            else:
                context = f"Order {order_id} not found in system."
                answer = f"I couldn't find Amazon order number {order_id}. Could you please double-check the 17-digit number?"
        else:
            # Phone lookup fallback
            orders = get_orders_data()
            matching_orders = [o for o in orders if o.get("customer_phone") == caller_phone]
            tool_used = "get_order_status"
            tool_inputs = {"caller_phone": caller_phone}
            tool_outputs = {"matching_orders_count": len(matching_orders)}
            if matching_orders:
                recent_order = matching_orders[0]  # Take the most recent one
                order_id = recent_order["order_id"]
                tool_outputs["matched_order"] = recent_order
                source = "orders.json"
                context = (
                    f"Order {order_id} belongs to {recent_order.get('customer_name', 'customer')}. "
                    f"Product: {recent_order.get('product', 'N/A')}. "
                    f"Status: {recent_order['status']}. "
                    f"Courier: {recent_order.get('courier', 'ATS')}. "
                    f"Delivery: {recent_order['expected_delivery']}. "
                    f"Caller phone matching. Ask the customer if this is the order they are calling about."
                )
                answer = (
                    f"I see a recent order for your {recent_order.get('product', 'item')} "
                    f"under order ID {order_id}. Is that the one you are calling about?"
                )
            else:
                context = "No orders found for this phone number."
                answer = "Could you please share your 17-digit Amazon order number? I'll look that up right away."

    elif intent == "FAQ_POLICY":
        tool_used = "rag_query"
        tool_inputs = {"question": message}
        tool_outputs = rag_result if rag_result else {"error": "No results"}
        if rag_result:
            context = rag_result["answer_context"]
            source = rag_result["source"]
            confidence = rag_result.get("confidence", 0)
            
            # Extract RAG trace for visualization
            rag_telemetry["embedding_time_ms"] = rag_result.get("embedding_time_ms", 0.0)
            rag_telemetry["search_time_ms"] = rag_result.get("search_time_ms", 0.0)
            rag_telemetry["matches"] = rag_result.get("matches", [])
            rag_telemetry["query_vector"] = rag_result.get("query_vector", [])

            if confidence < 0.30:
                answer = "Let me check our Amazon India policies for you. Could you please hold for a moment?"
            else:
                # Use context or custom Amazon-themed messages based on source
                if "refund" in source.lower():
                    answer = "For Amazon India, refunds take 2 hours for Amazon Pay, 2-4 business days for UPI, and 3-5 business days for cards."
                elif "delivery" in source.lower():
                    answer = "Amazon India offers free One-Day or Two-Day Prime delivery, and Standard delivery in 2-4 days (40 rupees under 499 rupees)."
                elif "warranty" in source.lower():
                    answer = "To claim brand warranty, download your tax invoice from Your Orders and visit the authorized service center."
                elif "complaint" in source.lower():
                    answer = "Amazon India returns are 10 days for electronics (replacement only) and 30 days for fashion. I can register a complaint ticket for you."
                elif "payment" in source.lower():
                    answer = "Amazon India accepts UPI, Amazon Pay Balance, Credit/Debit cards, Cash on Delivery, and EMI."
                else:
                    answer = context[:200]
                    if not answer.endswith("."):
                        answer += "."
        else:
            context = "No matching policy found."
            answer = "I don't have that specific information right now. Would you like me to arrange a callback from our team?"

    elif intent == "COMPLAINT_REGISTRATION":
        tool_used = "create_ticket"
        tool_inputs = {"caller_phone": caller_phone, "priority": "Medium", "message": message[:80]}
        ticket = create_ticket(caller_phone, f"Complaint: {message[:100]}", "Medium", message)
        tool_outputs = ticket
        context = f"Complaint ticket {ticket['ticket_id']} created with medium priority."
        source = "tickets.json"
        answer = (
            f"I've registered your complaint and assigned ticket ID {ticket['ticket_id']}. "
            f"Our team will follow up within 24 hours. I sincerely apologize for the inconvenience."
        )

    elif intent == "HUMAN_ESCALATION":
        tool_used = "create_ticket"
        tool_inputs = {"caller_phone": caller_phone, "priority": "High", "escalation": True}
        ticket = create_ticket(caller_phone, "Customer requested urgent human escalation", "High", message)
        tool_outputs = ticket
        escalated = True
        context = f"High-priority ticket {ticket['ticket_id']} created. Customer escalated."
        answer = (
            "I sincerely apologize for the frustration you've experienced. "
            f"I've created a high-priority ticket ({ticket['ticket_id']}) and an Amazon India support supervisor will call you within the hour."
        )

    elif intent == "BOOK_CALLBACK":
        tool_used = "book_callback"
        preferred_time = _extract_preferred_time(message)
        tool_inputs = {"caller_phone": caller_phone, "preferred_time": preferred_time}
        cb = book_callback(caller_phone, preferred_time, f"Customer requested callback: {message[:80]}")
        tool_outputs = cb
        context = f"Callback {cb['callback_id']} scheduled for {preferred_time}."
        answer = (
            f"I've scheduled a callback for you {preferred_time}. "
            f"Your callback ID is {cb['callback_id']}. Our support team will call you at that time."
        )

    else:
        answer = (
            "Welcome to Amazon India Customer Support. I can help you track your order, "
            "check our refund or return policies, schedule a callback, "
            "or connect you with a supervisor. What can I do for you today?"
        )

    # ── LLM Naturalization ───────────────────────────────────
    # Get or create session history for this caller
    session_history = _sessions.get(caller_phone, [])
    system_prompt = get_system_prompt(intent, context)
    
    # Observability Trace Logs
    llm_telemetry = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "model": settings.GROQ_MODEL,
        "latency_ms": 0.0,
        "system_prompt": system_prompt
    }

    llm_result = generate_response(
        prompt=message,
        system_message=system_prompt,
        conversation_history=session_history
    )

    if isinstance(llm_result, dict):
        llm_telemetry["prompt_tokens"] = llm_result.get("prompt_tokens", 0)
        llm_telemetry["completion_tokens"] = llm_result.get("completion_tokens", 0)
        llm_telemetry["total_tokens"] = llm_result.get("total_tokens", 0)
        llm_telemetry["latency_ms"] = llm_result.get("latency_ms", 0.0)
        llm_answer = llm_result.get("answer")
    else:
        llm_answer = llm_result

    if llm_answer:
        answer = llm_answer.replace("**", "").replace("*", "").replace("\n", " ").strip()

    # Update session memory
    session_history.append({"role": "user", "content": message})
    session_history.append({"role": "assistant", "content": answer})
    _sessions[caller_phone] = session_history[-12:]  # Keep last 6 turns

    # Calculate response time
    response_time_ms = round((time.time() - start_time) * 1000, 1)

    # AI summary
    summary = _generate_summary(intent, sentiment_label, tool_used, escalated)

    # Compile the complete trace payload for Explainable AI observability
    pipeline_trace = {
        "stt": {
            "latency_ms": round(response_time_ms * 0.1, 1),
            "transcript": message
        },
        "intent": {
            "intent": intent,
            "sentiment": sentiment_label,
            "sentiment_score": sentiment_score,
            "confidence": intent_confidence
        },
        "rag": rag_telemetry,
        "llm": llm_telemetry,
        "tool": {
            "tool_used": tool_used,
            "inputs": tool_inputs,
            "outputs": tool_outputs
        },
        "tts": {
            "latency_ms": round(response_time_ms * 0.15, 1)
        }
    }

    # Log the call
    call_record = {
        "call_id": call_id,
        "caller_phone": caller_phone,
        "message": message,
        "intent": intent,
        "intent_confidence": intent_confidence,
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "tool_used": tool_used,
        "source": source,
        "escalated": escalated,
        "answer": answer,
        "context": context,
        "response_time_ms": response_time_ms,
        "summary": summary,
        "timestamp": datetime.now().isoformat(),
        "pipeline_trace": pipeline_trace
    }
    log_call(call_record)

    return {
        "call_id": call_id,
        "intent": intent,
        "intent_confidence": intent_confidence,
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "tool_used": tool_used,
        "answer": answer,
        "source": source,
        "escalated": escalated,
        "summary": summary,
        "response_time_ms": response_time_ms,
        "timestamp": datetime.now().isoformat(),
        "pipeline_trace": pipeline_trace
    }


def _extract_preferred_time(message: str) -> str:
    """Extract preferred callback time from message."""
    msg = message.lower()
    if "morning" in msg:
        return "tomorrow morning (9 AM - 12 PM)"
    elif "afternoon" in msg:
        return "this afternoon (12 PM - 5 PM)"
    elif "evening" in msg:
        return "this evening (5 PM - 8 PM)"
    elif "tomorrow" in msg:
        return "tomorrow"
    elif "weekend" in msg:
        return "this weekend"
    elif "today" in msg:
        return "today"
    return "at the earliest available time"


def _generate_summary(intent: str, sentiment: str, tool_used: str, escalated: bool) -> str:
    """Generate a human-readable summary of the call."""
    intent_map = {
        "ORDER_STATUS": "checked order status",
        "FAQ_POLICY": "inquired about company policy",
        "COMPLAINT_REGISTRATION": "registered a formal complaint",
        "HUMAN_ESCALATION": "requested human agent (escalated)",
        "BOOK_CALLBACK": "scheduled a callback",
        "GENERAL": "general inquiry",
    }
    action = intent_map.get(intent, "general inquiry")
    esc_note = " — ESCALATED to human agent" if escalated else ""
    return f"Customer {action} | Sentiment: {sentiment} | Tool: {tool_used}{esc_note}"


def log_call(call_data: dict):
    """Persist call log to JSON file with size limit."""
    file_path = os.path.join(settings.DATA_DIR, "calls.json")
    calls = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                calls = json.load(f)
            except Exception:
                calls = []

    calls.insert(0, call_data)

    # Trim to max size
    if len(calls) > settings.MAX_CALLS_LOG:
        calls = calls[:settings.MAX_CALLS_LOG]

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(calls, f, indent=2, ensure_ascii=False)
