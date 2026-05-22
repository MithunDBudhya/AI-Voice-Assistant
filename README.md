# SupportGenie Voice AI

A production-ready AI voice agent that talks, understands, retrieves, acts, escalates, and reports.

## 1. Problem Statement
Many businesses struggle with scaling customer support. Traditional IVRs are rigid and frustrating, while human agents are overwhelmed with repetitive queries like "Where is my order?" or "What is your refund policy?".

## 2. Solution
SupportGenie is a next-generation AI Voice Support Agent that provides an end-to-end customer support platform. It can:
- **Talk & Understand:** Communicate naturally via voice.
- **Retrieve:** Search internal knowledge bases for policy FAQs using ChromaDB.
- **Act:** Perform backend actions like checking order status or booking a callback.
- **Escalate:** Detect customer frustration and immediately hand off to human agents while creating priority tickets.
- **Report:** Provide a real-time command-center dashboard for managers to monitor all activities.

## 3. Architecture
- **Frontend:** React, Vite, TailwindCSS, Framer Motion, Recharts
- **Backend:** FastAPI, Python, Pydantic
- **LLM/AI:** Groq (Llama3) for natural language generation
- **RAG Engine:** ChromaDB + SentenceTransformers
- **Voice Webhook:** Compatible with Vapi.ai or similar voice routing platforms.

## 4. Features
- **Call Simulator:** Test the exact AI pipeline visually without making a real phone call.
- **RAG Knowledge Base:** Upload text policies and let the AI answer grounded questions.
- **Intent & Sentiment Detection:** Dynamically classify intents and gauge frustration levels.
- **Real-Time Dashboard:** View metrics on calls, escalations, callbacks, and resolutions.

## 5. Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI + Groq API
- Vector DB: ChromaDB

## 6. Local Setup
See `DEPLOYMENT.md` for local setup and cloud deployment instructions.

## 7. RAG Ingestion
The system reads `.txt` files from `backend/app/rag/knowledge_base`. 
To index these documents into ChromaDB, run:
```bash
python -m app.rag.ingest
```
Or use the **Sync Documents** button in the frontend Knowledge Base dashboard.

## 8. Vapi Setup
See `VAPI_SETUP.md`.

## 9. Deployment to Vercel and Render
See `DEPLOYMENT.md`.

## 10. Demo Script
See `DEMO_SCRIPT.md`.

## 11. Future Scope
- Connect to an actual PostgreSQL or MongoDB database instead of JSON files.
- Introduce Twilio SMS fallback for complex order updates.
- Allow uploading PDF documents directly from the frontend.
