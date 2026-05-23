# SupportGenie — Hackathon Demo Guide

## For Judges: 60-Second Pitch

**Problem:** Traditional customer support is broken. IVR systems frustrate customers. Human agents are overwhelmed with repetitive questions like "Where is my order?"

**Solution:** SupportGenie is a next-generation AI Voice Support Agent that handles the full support lifecycle end-to-end:
- Listens (STT) → Understands (LLM + RAG) → Acts (Tools) → Responds (TTS) → Escalates (Tickets) → Reports (Dashboard)

**Innovation:** Unlike simple chatbots, SupportGenie has:
1. Frustration detection that auto-escalates before customers hang up in anger
2. RAG-based policy retrieval so it never hallucinates company policies  
3. Multi-turn conversation memory across the session
4. A live analytics command center showing exactly what's happening

---

## Demo Flow (5 minutes)

### Prep (30 seconds)
1. Open http://localhost:5173 (or deployed URL)
2. Navigate to **Knowledge Base** → Click **"Sync Documents"** (ensures RAG is indexed)
3. Navigate to **Call Simulator** → Set language to "English"
4. Open **Dashboard** in a second tab

---

## Demo Scenario 1: Order Tracking (60 seconds)

**Type:** `Where is my order 1023?`

**What judges see:**
- Intent badge: `ORDER_STATUS`
- Tool badge: `get_order_status()`
- Source badge: `orders.json`
- Response: "Your order 1023 is Out for Delivery and expected today by 7 PM."

**What to say:** "Notice how the system extracted the 4-digit order ID, called the order lookup tool, and returned an accurate, conversational response in under a second. No hardcoded string — the tool actually queries our database."

---

## Demo Scenario 2: Policy Query via RAG (60 seconds)

**Type:** `What is your refund policy?`

**What judges see:**
- Intent badge: `FAQ_POLICY`
- Tool badge: `rag_query()`
- Source badge: `refund_policy.txt`
- Response: Accurate policy details from the document

**What to say:** "This is RAG in action. The system didn't guess — it embedded the question as a vector, found the most semantically similar chunk in our policy documents, and used that as grounded context for the LLM. The LLM is constrained to only answer based on this retrieved context."

---

## Demo Scenario 3: Frustration Detection + Escalation (60 seconds)

**Type:** `I am absolutely FURIOUS! I've called many times and nobody helps me!!!`

**What judges see:**
- Intent badge: `HUMAN_ESCALATION` ← auto-detected from frustration
- Sentiment badge: `frustrated`
- Tool badge: `create_ticket()`
- Red "Escalation Triggered" indicator
- Response: Empathetic apology + ticket creation confirmation

**Then:** Switch to Tickets tab — show the High-priority ticket appeared in real time.

**What to say:** "Our frustration scoring system detected multiple signals — negative keywords, ALL CAPS, repeated exclamation marks — and automatically escalated this to a human agent with a high-priority ticket. No customer has to explicitly ask to be escalated."

---

## Demo Scenario 4: Callback Booking (30 seconds)

**Type:** `Book a callback for tomorrow morning please`

**What judges see:**
- Intent: `BOOK_CALLBACK`
- Tool: `book_callback()`
- Response: Confirms "tomorrow morning" callback

**Then:** Switch to Callbacks tab — new pending callback listed.

---

## Demo Scenario 5: Voice Call Mode (optional, 30 seconds)

Click **"Start Voice Call"** → speak one of the above queries → hear the AI respond aloud.

**What to say:** "This is the full voice experience. The browser's speech recognition captures the customer's voice, processes it through our full AI pipeline, and speaks the response using browser TTS. In production, this connects to Vapi.ai for real phone calls."

---

## Show: Dashboard (30 seconds)

Navigate to Dashboard. Show:
- Live call counts updating after your demo calls
- Intent distribution chart showing real data from your demo
- Navigate to Analytics → show sentiment pie chart, weekly volume

**What to say:** "Every call the AI handles gets logged and analyzed in real time. A support manager gets this full visibility — which issues are most common, which customers are frustrated, which calls were escalated."

---

## Technical Architecture Explanation

```
Phone Call / Browser
        ↓
   Vapi.ai / Web Speech API (STT)
        ↓
   FastAPI Backend
        ├── Intent Classifier (keyword + priority rules)
        ├── Sentiment Detector (frustration score 0-10)
        ├── Tool Router
        │   ├── Order Database (JSON)
        │   ├── RAG Engine (SentenceTransformers + cosine similarity)
        │   ├── Ticket Creator
        │   └── Callback Scheduler
        ├── Groq LLM (Llama 3 8B) - response generation
        └── Analytics Logger
        ↓
   React Dashboard (Recharts, Framer Motion)
        ↓
   Vapi.ai / Web Speech API (TTS)
        ↓
   Customer hears response
```

---

## Business Value

| Metric | Traditional Support | SupportGenie |
|--------|---------------------|--------------|
| Cost per ticket | $15-25 | ~$0.002 (API cost) |
| Response time | 5-20 minutes | < 1.5 seconds |
| Availability | Business hours | 24/7/365 |
| Scalability | Hire more agents | Auto-scales |
| Frustration detection | Reactive (customer hangs up) | Proactive (auto-escalate) |

---

## Innovation Points

1. **Frustration Scoring System** — Not just binary sentiment, but a 0-10 score with auto-escalation threshold. Novel compared to simple positive/negative classification.

2. **Grounded RAG Responses** — LLM is explicitly forbidden from answering outside retrieved context. Zero hallucination on company policies.

3. **Multi-Turn Memory** — Conversation history injected into every LLM prompt. Customer can say "What about the return policy?" and the agent understands they're asking about the order they just discussed.

4. **Real-Time Analytics Command Center** — Not a static demo dashboard, but computed live from actual call data. Resolution rate, frustration trends, tool usage patterns — all real.

5. **Multilingual Support** — Intent classification includes Telugu and Kannada keywords. Voice mode supports language switching.

---

## Future Scope (Tell Judges This)

1. **PostgreSQL/MongoDB** — Replace JSON flat files for production scale
2. **Twilio Integration** — Real PSTN phone calls without Vapi
3. **PDF Knowledge Base** — Upload product manuals directly from dashboard
4. **Proactive Outreach** — Auto-call customers about delayed orders
5. **WhatsApp Integration** — Same AI agent on WhatsApp Business API
6. **Multi-agent Orchestration** — Specialist agents for billing vs. shipping vs. technical
7. **Voice Cloning** — Brand-consistent AI voice using ElevenLabs
8. **CRM Integration** — Sync tickets and customer history to Salesforce/Zendesk

---

## One-Line Descriptions for Each Feature

| Feature | Description |
|---------|-------------|
| Call Simulator | Test the complete AI pipeline without a real phone — type or speak |
| Intent Classification | 7 intent categories with multilingual keyword matching |
| Sentiment Detection | Frustration scoring (0-10) with auto-escalation at threshold 3 |
| RAG Knowledge Base | Semantic search over 4 policy documents, chunked and embedded |
| Order Status Tool | Real-time order lookup from database |
| Ticket System | High/Medium priority ticket creation with lifecycle management |
| Callback Scheduling | Smart time extraction + calendar-ready callback booking |
| Multi-turn Memory | Session-based conversation history for context continuity |
| Live Dashboard | 30-second polling, real metrics from actual call data |
| Vapi.ai Integration | Production telephony webhook ready for real phone numbers |
