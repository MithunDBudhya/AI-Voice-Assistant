from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import CallRequest, CallResponse, QueryRequest, QueryResponse, TicketRequest, CallbackRequest
from app.agent.orchestrator import handle_call
from app.rag.ingest import ingest_documents
from app.rag.retriever import query_knowledge_base
from app.tools.ticket_tool import create_ticket as create_ticket_tool
from app.tools.callback_tool import book_callback as book_callback_tool
from app.services.analytics_service import get_dashboard_summary, get_calls, get_tickets, get_callbacks
import uvicorn
import os

app = FastAPI(title="SupportGenie Voice AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "*"],  # Allow all for hackathon ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/agent/respond", response_model=CallResponse)
def agent_respond(request: CallRequest):
    try:
        response = handle_call(request.caller_phone, request.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/webhook")
async def voice_webhook(request: Request):
    """
    Handles Vapi.ai webhook events.
    Vapi sends different message types: 
      - assistant-request: Vapi wants an AI response to the user's speech
      - function-call: Vapi wants us to execute a tool
      - status-update: Call status changed
      - end-of-call-report: Call ended, summary available
    """
    data = await request.json()
    msg = data.get("message", {})
    msg_type = msg.get("type", "")

    # ── Handle assistant-request (main conversation) ──
    if msg_type == "assistant-request":
        # Extract the latest user message from the conversation
        messages = msg.get("artifact", {}).get("messages", [])
        caller_phone = msg.get("call", {}).get("customer", {}).get("number", "+0000000000")
        
        # Find the last user message
        transcript = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                transcript = m.get("content", "")
                break
        
        if not transcript:
            return {"assistant": {"content": "I didn't catch that. Could you please repeat?"}}
        
        try:
            response = handle_call(caller_phone, transcript)
            return {
                "assistant": {
                    "content": response["answer"]
                }
            }
        except Exception as e:
            return {"assistant": {"content": "I'm having a technical issue. Please hold while I connect you to a human agent."}}
    
    # ── Handle status-update ──
    elif msg_type == "status-update":
        status = msg.get("status", "")
        print(f"[Vapi] Call status: {status}")
        return {"status": "ok"}
    
    # ── Handle end-of-call-report ──
    elif msg_type == "end-of-call-report":
        summary = msg.get("artifact", {}).get("transcript", "")
        duration = msg.get("call", {}).get("duration", 0)
        print(f"[Vapi] Call ended. Duration: {duration}s")
        return {"status": "ok"}
    
    # ── Fallback: try to handle as a simple text message ──
    else:
        transcript = msg.get("transcript", "") or data.get("text", "")
        caller_phone = msg.get("customer", {}).get("number", "+0000000000")
        
        if not transcript:
            return {"assistant": {"content": "Hello! How can I help you today?"}}
        
        try:
            response = handle_call(caller_phone, transcript)
            return {"assistant": {"content": response["answer"]}}
        except Exception as e:
            return {"assistant": {"content": "I'm experiencing technical difficulties. Please try again."}}

@app.post("/rag/ingest")
def rag_ingest():
    ingest_documents()
    return {"status": "success", "message": "Knowledge base ingested."}

@app.post("/rag/query", response_model=QueryResponse)
def rag_query_endpoint(request: QueryRequest):
    result = query_knowledge_base(request.question)
    if not result:
        raise HTTPException(status_code=404, detail="No context found")
    return QueryResponse(**result)

@app.post("/tickets")
def create_ticket(req: TicketRequest):
    ticket = create_ticket_tool(req.caller_phone, req.reason, req.priority, req.transcript)
    return ticket

@app.post("/callbacks")
def create_callback(req: CallbackRequest):
    callback = book_callback_tool(req.caller_phone, req.preferred_time, req.reason)
    return callback

@app.get("/dashboard/summary")
def get_summary():
    return get_dashboard_summary()

@app.get("/dashboard/calls")
def get_calls_endpoint():
    return get_calls()

@app.get("/dashboard/tickets")
def get_tickets_endpoint():
    return get_tickets()

@app.get("/dashboard/callbacks")
def get_callbacks_endpoint():
    return get_callbacks()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
