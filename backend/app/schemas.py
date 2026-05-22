from pydantic import BaseModel
from typing import Optional, List, Any

class CallRequest(BaseModel):
    caller_phone: str
    message: str

class CallResponse(BaseModel):
    call_id: str
    intent: str
    sentiment: str
    tool_used: str
    answer: str
    source: Optional[str] = None
    escalated: bool
    summary: str
    timestamp: str

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer_context: str
    source: str
    confidence: float

class TicketRequest(BaseModel):
    caller_phone: str
    reason: str
    priority: str
    transcript: str

class CallbackRequest(BaseModel):
    caller_phone: str
    preferred_time: str
    reason: str
