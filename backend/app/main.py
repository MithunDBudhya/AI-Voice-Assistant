import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.schemas import (
    CallRequest, CallResponse, QueryRequest, QueryResponse,
    TicketRequest, CallbackRequest
)
from app.agent.orchestrator import handle_call
from app.rag.ingest import ingest_documents
from app.rag.retriever import query_knowledge_base
from app.tools.ticket_tool import create_ticket as create_ticket_tool, update_ticket_status
from app.tools.callback_tool import book_callback as book_callback_tool, update_callback_status
from app.services.analytics_service import (
    get_dashboard_summary, get_calls, get_tickets,
    get_callbacks, get_deep_analytics
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Startup: auto-ingest RAG if DB doesn't exist ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = os.path.join(settings.DATA_DIR, "simple_rag_db.json")
    if not os.path.exists(db_path):
        logger.info("RAG database not found. Auto-ingesting knowledge base...")
        try:
            ingest_documents()
            logger.info("RAG ingestion complete.")
        except Exception as e:
            logger.error(f"RAG auto-ingest failed: {e}")
    else:
        logger.info("RAG database found. Skipping auto-ingest.")
    yield


app = FastAPI(
    title="SupportGenie Voice AI",
    description="Production-grade AI customer support voice agent with RAG, intent detection, and real-time analytics.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"← {response.status_code} {request.url.path}")
    return response


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "version": "2.0.0",
        "model": settings.GROQ_MODEL,
        "groq_enabled": bool(settings.GROQ_API_KEY)
    }


# ── Agent ──────────────────────────────────────────────────────────────────
@app.post("/agent/respond", response_model=CallResponse, tags=["Agent"])
def agent_respond(request: CallRequest):
    """Process a text/voice customer message through the full AI pipeline."""
    try:
        response = handle_call(request.caller_phone, request.message)
        return response
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Vapi.ai Webhook ────────────────────────────────────────────────────────
@app.post("/voice/webhook", tags=["Voice"])
async def voice_webhook(request: Request):
    """
    Handles Vapi.ai webhook events:
    - assistant-request: Main conversation turn
    - status-update: Call status changed
    - end-of-call-report: Call ended
    """
    data = await request.json()
    msg = data.get("message", {})
    msg_type = msg.get("type", "")

    if msg_type == "assistant-request":
        messages = msg.get("artifact", {}).get("messages", [])
        caller_phone = msg.get("call", {}).get("customer", {}).get("number", "+0000000000")

        transcript = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                transcript = m.get("content", "")
                break

        if not transcript:
            return {"assistant": {"content": "I didn't catch that. Could you please repeat?"}}

        try:
            response = handle_call(caller_phone, transcript)
            return {"assistant": {"content": response["answer"]}}
        except Exception as e:
            logger.error(f"Vapi webhook error: {e}")
            return {"assistant": {"content": "I'm experiencing a technical issue. Let me connect you to a human agent."}}

    elif msg_type == "status-update":
        status = msg.get("status", "")
        logger.info(f"[Vapi] Call status: {status}")
        return {"status": "ok"}

    elif msg_type == "end-of-call-report":
        duration = msg.get("call", {}).get("duration", 0)
        logger.info(f"[Vapi] Call ended. Duration: {duration}s")
        return {"status": "ok"}

    else:
        transcript = msg.get("transcript", "") or data.get("text", "")
        caller_phone = msg.get("customer", {}).get("number", "+0000000000")
        if not transcript:
            return {"assistant": {"content": "Hello! How can I help you today?"}}
        try:
            response = handle_call(caller_phone, transcript)
            return {"assistant": {"content": response["answer"]}}
        except Exception:
            return {"assistant": {"content": "I'm experiencing technical difficulties. Please try again."}}


# ── RAG ────────────────────────────────────────────────────────────────────
@app.post("/rag/ingest", tags=["RAG"])
def rag_ingest():
    """Ingest all documents from the knowledge base into the vector store."""
    try:
        ingest_documents()
        return {"status": "success", "message": "Knowledge base ingested successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/query", response_model=QueryResponse, tags=["RAG"])
def rag_query_endpoint(request: QueryRequest):
    """Query the knowledge base for relevant policy context."""
    result = query_knowledge_base(request.question)
    if not result:
        raise HTTPException(status_code=404, detail="No matching context found above confidence threshold.")
    return QueryResponse(**result)


@app.get("/rag/documents", tags=["RAG"])
def get_documents():
    """List all documents currently in the knowledge base."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    if not os.path.exists(docs_dir):
        return {"documents": []}

    files = []
    for filename in os.listdir(docs_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(docs_dir, filename)
            size = os.path.getsize(filepath)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            files.append({
                "filename": filename,
                "size_bytes": size,
                "word_count": len(content.split()),
                "status": "indexed"
            })

    return {"documents": files, "total": len(files)}


# ── Tickets ────────────────────────────────────────────────────────────────
class TicketStatusUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None


@app.post("/tickets", tags=["Tickets"])
def create_ticket(req: TicketRequest):
    """Manually create a support ticket."""
    ticket = create_ticket_tool(req.caller_phone, req.reason, req.priority, req.transcript)
    return ticket


@app.patch("/tickets/{ticket_id}", tags=["Tickets"])
def patch_ticket(ticket_id: str, req: TicketStatusUpdate):
    """Update a ticket's status (Open → In Progress → Resolved)."""
    result = update_ticket_status(ticket_id, req.status, req.resolution_notes)
    if not result:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
    return result


# ── Callbacks ──────────────────────────────────────────────────────────────
class CallbackStatusUpdate(BaseModel):
    status: str


@app.post("/callbacks", tags=["Callbacks"])
def create_callback(req: CallbackRequest):
    """Manually schedule a callback."""
    callback = book_callback_tool(req.caller_phone, req.preferred_time, req.reason)
    return callback


@app.patch("/callbacks/{callback_id}", tags=["Callbacks"])
def patch_callback(callback_id: str, req: CallbackStatusUpdate):
    """Update a callback's status (Pending → Completed)."""
    result = update_callback_status(callback_id, req.status)
    if not result:
        raise HTTPException(status_code=404, detail=f"Callback {callback_id} not found.")
    return result


# ── Dashboard & Analytics ──────────────────────────────────────────────────
@app.get("/dashboard/summary", tags=["Analytics"])
def get_summary():
    """Get high-level KPI summary for the dashboard."""
    return get_dashboard_summary()


@app.get("/dashboard/calls", tags=["Analytics"])
def get_calls_endpoint():
    """Get all call logs."""
    return get_calls()


@app.get("/dashboard/tickets", tags=["Analytics"])
def get_tickets_endpoint():
    """Get all tickets."""
    return get_tickets()


@app.get("/dashboard/callbacks", tags=["Analytics"])
def get_callbacks_endpoint():
    """Get all callbacks."""
    return get_callbacks()


@app.get("/dashboard/analytics", tags=["Analytics"])
def get_analytics():
    """Get deep analytics: sentiment distribution, intent breakdown, daily trends, top issues."""
    return get_deep_analytics()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
