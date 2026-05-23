# SupportGenie Voice AI — Working Criteria Document

## System Overview

SupportGenie is a full-stack AI customer support platform. It processes customer messages (text or voice), classifies intent, retrieves knowledge, executes backend tools, generates natural language responses, and logs everything for a real-time analytics dashboard.

---

## Architecture Layers

```
Customer Message (Voice/Text)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  VOICE LAYER (Browser/Vapi.ai)                              │
│  Web Speech API (STT) → Text → POST /agent/respond          │
│  POST /agent/respond → Text → Web Speech API (TTS)          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT LAYER (orchestrator.py)                              │
│  1. Intent Classification                                    │
│  2. Sentiment Detection + Frustration Score                  │
│  3. Auto-escalation if score >= 3                            │
│  4. Tool Execution                                           │
│  5. RAG Context Retrieval                                    │
│  6. LLM Response Generation (Groq/Llama3)                   │
│  7. Call Logging + Session Memory Update                     │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  TOOL LAYER                                                 │
│  get_order_status() → orders.json lookup                    │
│  rag_query()        → Vector similarity search              │
│  create_ticket()    → tickets.json append                   │
│  book_callback()    → callbacks.json append                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow — End-to-End

### Step 1: Customer Input
- **Text mode:** Customer types in the Call Simulator → POSTs to `POST /agent/respond`
- **Voice mode:** Browser's Web Speech API captures audio → transcribes to text → POSTs to API
- **Telephony mode:** Vapi.ai receives phone call → sends webhook to `POST /voice/webhook`

### Step 2: Intent Classification
Keyword-based pattern matching with priority ordering (HUMAN_ESCALATION highest priority → GENERAL fallback).

### Step 3: Sentiment Detection
- Counts negative/positive keywords with scoring
- Detects ALL CAPS and repeated punctuation as frustration signals
- Returns (sentiment_label, frustration_score 0-10)
- Auto-escalation if frustration_score >= 3

### Step 4: Tool Execution

| Intent | Tool | Action |
|--------|------|--------|
| ORDER_STATUS | get_order_status(order_id) | orders.json lookup |
| FAQ_POLICY | rag_query(message) | Vector similarity search |
| HUMAN_ESCALATION | create_ticket(phone, reason, "High", transcript) | High priority ticket |
| COMPLAINT | create_ticket(phone, reason, "Medium", transcript) | Medium priority ticket |
| BOOK_CALLBACK | book_callback(phone, time, reason) | Schedules callback |

### Step 5: RAG Retrieval
- Loads simple_rag_db.json (pre-computed SentenceTransformer embeddings)
- Computes cosine similarity against all stored chunks
- Returns top-3 results filtered by score >= 0.3 threshold
- Combines top-2 chunks as context for LLM

### Step 6: LLM Response Generation
- Builds system prompt with: intent instructions + RAG context + conversation history
- Calls Groq API (Llama 3 8B), max 150 tokens
- Retry logic (2 attempts) with exponential backoff
- Falls back to deterministic hardcoded response if LLM unavailable

### Step 7: Call Logging
Every call recorded to calls.json with: call_id, session_id, intent, sentiment, frustration_score, tool_used, escalated, response_time_ms, timestamp.

---

## RAG Pipeline Detail

### Document Ingestion
```
.txt files in knowledge_base/
    ↓
chunk_text() — 300-char sentence-based chunks, 50-char overlap
    ↓
SentenceTransformer.encode() — 384-dim vector per chunk
    ↓
Save to simple_rag_db.json
```

Auto-runs on first backend startup if DB missing. Re-run via /rag/ingest or "Sync Documents" button.

---

## Dashboard Analytics Flow

All metrics computed live from calls.json every 30 seconds:

| Metric | Computation |
|--------|-------------|
| Total Calls | len(calls) |
| Resolution Rate | resolved / total * 100 |
| Avg Response Time | mean(response_time_ms) |
| Intent Distribution | Counter(c.intent for c in calls) |
| Sentiment Distribution | Counter(c.sentiment for c in calls) |
| Hourly Volume | Group by hour, filter last 24h |
| Weekly Volume | Group by weekday, filter last 7 days |

---

## Escalation Logic

1. Frustration keywords counted (+1 each, +2 for severe)
2. If frustration_score >= 3: intent forced to HUMAN_ESCALATION
3. High-priority ticket created in tickets.json
4. Ticket immediately visible on dashboard
5. Tickets page allows status updates: Open > In Progress > Resolved > Closed

---

## Callback System

1. Customer says "Book a callback tomorrow morning"
2. extract_callback_time() parses preferred time
3. Callback saved to callbacks.json with "Pending" status
4. Callbacks page shows entry, supports Complete/Cancel actions via PUT API

---

## Performance Characteristics

| Operation | Typical Latency |
|-----------|----------------|
| Intent detection | < 5ms |
| Order lookup | < 10ms |
| RAG retrieval | 200-500ms (first call loads model) |
| Groq LLM call | 300-800ms |
| Total end-to-end | 500ms - 1.5s |
