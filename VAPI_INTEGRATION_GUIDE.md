# 🎙️ SupportGenie Vapi.ai & Ngrok Integration Guide

This guide explains how to connect your local **SupportGenie Voice AI** backend to **Vapi.ai** using the active ngrok tunnel.

---

## 🔗 Live Connection Endpoints

Your local development servers are running and connected to the public internet:

*   **FastAPI Backend (Local):** `http://localhost:8000`
*   **React Dashboard (Local):** `http://localhost:5173`
*   **Active Ngrok Public HTTPS URL:** `https://surfboard-sloppy-alienable.ngrok-free.dev`
*   **Vapi Webhook Endpoint:** `https://surfboard-sloppy-alienable.ngrok-free.dev/voice/webhook`

---

## 🛠️ Step-by-Step Vapi.ai Configuration

Follow these steps to wire up Vapi.ai to your local server:

### 1. Log In / Sign Up
*   Go to [Vapi.ai Dashboard](https://dashboard.vapi.ai/) and sign in.

### 2. Create or Choose an Assistant
*   Navigate to the **Assistants** tab in the sidebar.
*   Click **Create Assistant** (choose a blank template or voice agent style you prefer).
*   Give it a name, e.g., `SupportGenie Voice Agent`.

### 3. Configure the Custom Webhook Server URL
*   Under your assistant's settings, scroll down to the **Model** section or find the **Server** settings.
*   Locate the **Server URL** input field.
*   Paste your active webhook URL:
    ```
    https://surfboard-sloppy-alienable.ngrok-free.dev/voice/webhook
    ```
*   Save the changes.

### 4. Setup Custom Webhook for Speech Synthesis (Optional / Highly Recommended)
*   Ensure that Vapi.ai uses your backend webhook to determine what to say.
*   Under the assistant setup, you can set the assistant to use **Custom Webhook** or ensure it sends an `assistant-request` to your Server URL on every turn. This allows your backend to classify intents (using Groq LLM) and execute RAG search locally.

---

## 🔄 How the Conversation Flow Works

When a user calls your Vapi phone number or initiates a web call:

1.  **Vapi Speech-to-Text:** The caller speaks, Vapi transcribes it in real-time.
2.  **Webhook Trigger:** Vapi sends a POST request with the conversation history to your backend:
    ```
    POST https://surfboard-sloppy-alienable.ngrok-free.dev/voice/webhook
    ```
3.  **Backend Processing:**
    *   FastAPI backend receives the transcript.
    *   Classifies customer intent (e.g. `ORDER_STATUS`, `FAQ_POLICY`, `BOOK_CALLBACK`, etc.) using your Groq LLM configuration.
    *   Performs semantic search (RAG) over your knowledge base if it's an FAQ/Policy question.
    *   Triggers tools (e.g., creating a ticket or booking a callback).
4.  **Backend Response:** The backend responds with the exact sentence Vapi should speak back:
    ```json
    {
      "assistant": {
        "content": "Your order 1234 is shipped and is expected tomorrow afternoon."
      }
    }
    ```
5.  **Analytics Update:** When the call ends, Vapi sends a status report which is written to `backend/app/data/calls.json`. Your React dashboard at `http://localhost:5173` immediately consumes this data to display live statistics, customer sentiment, ticket volumes, and callback request statuses.

---

## 🧪 Testing the Webhook Locally

You can test the endpoint yourself by simulating a webhook request from Vapi. Use a tool like Postman or run this PowerShell command:

```powershell
Invoke-RestMethod -Method Post -Uri "https://surfboard-sloppy-alienable.ngrok-free.dev/voice/webhook" -ContentType "application/json" -Body '{
  "message": {
    "type": "assistant-request",
    "call": {
      "customer": {
        "number": "+1234567890"
      }
    },
    "artifact": {
      "messages": [
        {
          "role": "user",
          "content": "Can I get a refund on my purchase?"
        }
      ]
    }
  }
}'
```

The server will respond with the RAG processed policy answer, and log the interaction in the React dashboard!
