from pydantic import BaseModel
from typing import Optional, List, Any


class CallRequest(BaseModel):
    caller_phone: str
    message: str


class CallResponse(BaseModel):
    call_id: str
    intent: str
    intent_confidence: Optional[float] = None
    sentiment: str
    sentiment_score: Optional[float] = None
    language: Optional[str] = None
    tool_used: str
    answer: str
    source: Optional[str] = None
    escalated: bool
    summary: str
    response_time_ms: Optional[float] = None
    timestamp: str


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer_context: str
    source: str
    confidence: float
    sources: Optional[List[str]] = None


class TicketRequest(BaseModel):
    caller_phone: str
    reason: str
    priority: str
    transcript: str


class CallbackRequest(BaseModel):
    caller_phone: str
    preferred_time: str
    reason: str
