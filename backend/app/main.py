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


# ── RAG & Document Management ────────────────────────────────────────────────
from fastapi import File, UploadFile, Form
import shutil
from datetime import datetime
from app.rag.history import load_metadata, register_policy_change, delete_policy_metadata, get_policy_history
from app.rag.parser import extract_text_from_file

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
    """List all documents currently in the knowledge base with details."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    if not os.path.exists(docs_dir):
        return {"documents": [], "total": 0}

    # Ensure default policies are initialized if not present
    from app.rag.default_policies import write_default_policies
    write_default_policies()

    meta = load_metadata()
    files = []
    
    for filename in os.listdir(docs_dir):
        if filename.lower().endswith((".txt", ".md", ".markdown", ".html", ".htm", ".pdf", ".docx")):
            filepath = os.path.join(docs_dir, filename)
            size = os.path.getsize(filepath)
            
            doc_meta = meta.get(filename, {})
            if not doc_meta:
                try:
                    content = extract_text_from_file(filepath)
                    register_policy_change(filename, filepath, content, "Auto registered by system")
                    meta = load_metadata()
                    doc_meta = meta.get(filename, {})
                except Exception:
                    pass
            
            files.append({
                "filename": filename,
                "size_bytes": size,
                "word_count": doc_meta.get("word_count", len(filename.split())),
                "category": doc_meta.get("category", "General"),
                "version": doc_meta.get("version", 1),
                "last_updated": doc_meta.get("last_updated", datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()),
                "status": doc_meta.get("status", "indexed")
            })

    return {"documents": files, "total": len(files)}


class PolicyCreateRequest(BaseModel):
    filename: str
    content: str
    category: Optional[str] = None
    comment: Optional[str] = "Initial registration"


@app.post("/rag/documents", tags=["RAG"])
def create_policy_document(req: PolicyCreateRequest):
    """Add a new text policy document and auto re-index."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    filename = req.filename
    if not filename.endswith((".txt", ".md")):
        filename += ".txt"
        
    filepath = os.path.join(docs_dir, filename)
    if os.path.exists(filepath):
        raise HTTPException(status_code=400, detail=f"Document {filename} already exists. Use PUT to edit.")

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(req.content.strip())
            
        register_policy_change(filename, filepath, req.content, req.comment)
        ingest_documents()
        return {"status": "success", "message": f"Document {filename} created and indexed."}
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/rag/documents/{filename}", tags=["RAG"])
def update_policy_document(filename: str, content: str = Form(...), comment: str = Form("Policy updated")):
    """Edit/update an existing policy document and auto re-index."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    filepath = os.path.join(docs_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Document {filename} not found.")

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content.strip())
            
        register_policy_change(filename, filepath, content, comment)
        ingest_documents()
        return {"status": "success", "message": f"Document {filename} updated to new version and re-indexed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/rag/documents/{filename}", tags=["RAG"])
def delete_policy_document(filename: str):
    """Delete a policy document from disk and vector DB."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    filepath = os.path.join(docs_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Document {filename} not found.")

    try:
        os.remove(filepath)
        delete_policy_metadata(filename)
        ingest_documents()
        return {"status": "success", "message": f"Document {filename} deleted and vector DB updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/documents/upload", tags=["RAG"])
async def upload_policy_document(file: UploadFile = File(...), comment: str = Form("File uploaded")):
    """Upload a policy file (PDF, DOCX, TXT, MD, HTML) and auto re-index."""
    docs_dir = settings.KNOWLEDGE_BASE_DIR
    filename = file.filename
    if not filename.lower().endswith((".txt", ".md", ".markdown", ".html", ".htm", ".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload PDF, DOCX, TXT, HTML or MD.")
        
    filepath = os.path.join(docs_dir, filename)
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        content = extract_text_from_file(filepath)
        register_policy_change(filename, filepath, content, comment)
        ingest_documents()
        return {"status": "success", "message": f"File {filename} successfully uploaded and indexed."}
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")


@app.get("/rag/documents/{filename}/history", tags=["RAG"])
def get_document_version_history(filename: str):
    """Get policy change log and history of edits."""
    history = get_policy_history(filename)
    return {"filename": filename, "history": history}


@app.get("/rag/retrieval/logs", tags=["RAG"])
def get_retrieval_logs():
    """Retrieve active semantic search query logs."""
    log_file = os.path.join(settings.DATA_DIR, "retrieval_logs.json")
    if not os.path.exists(log_file):
        return {"logs": []}
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            logs = json.load(f)
        return {"logs": sorted(logs, key=lambda x: x.get("timestamp"), reverse=True)}
    except Exception:
        return {"logs": []}


@app.get("/rag/retrieval/analytics", tags=["RAG"])
def get_retrieval_analytics():
    """Calculate RAG search speeds, confidence ratings, and hit distributions."""
    log_file = os.path.join(settings.DATA_DIR, "retrieval_logs.json")
    if not os.path.exists(log_file):
        return {
            "total_queries": 0,
            "avg_latency_ms": 0.0,
            "avg_confidence": 0.0,
            "hits_distribution": []
        }
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            logs = json.load(f)
    except Exception:
        logs = []

    if not logs:
        return {
            "total_queries": 0,
            "avg_latency_ms": 0.0,
            "avg_confidence": 0.0,
            "hits_distribution": []
        }

    total = len(logs)
    avg_latency = round(sum(l.get("latency_ms", 0.0) for l in logs) / total, 1)
    avg_conf = round(sum(l.get("confidence", 0.0) for l in logs) / total * 100, 1)

    hits = {}
    for l in logs:
        src = l.get("source", "none")
        if src != "none":
            hits[src] = hits.get(src, 0) + 1

    return {
        "total_queries": total,
        "avg_latency_ms": avg_latency,
        "avg_confidence": avg_conf,
        "hits_distribution": [{"name": k, "value": v} for k, v in hits.items()]
    }



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
