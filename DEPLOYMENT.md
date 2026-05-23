# SupportGenie — Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (takes 30 seconds to get)

---

## Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Open .env and add your GROQ_API_KEY

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

The server will automatically:
- Ingest the knowledge base on first startup
- Be available at http://localhost:8000
- Show API docs at http://localhost:8000/docs

---

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment (optional — defaults to localhost:8000)
# Create a .env file if your backend is on a different URL:
# VITE_API_BASE_URL=http://your-backend-url

# 3. Start dev server
npm run dev
```

Frontend will be available at http://localhost:5173

---

## Docker Compose (Recommended for Demo)

```bash
# From the project root (where docker-compose.yml is)
# Make sure GROQ_API_KEY is in your environment or .env file:
set GROQ_API_KEY=your_key_here   # Windows
export GROQ_API_KEY=your_key_here  # Mac/Linux

docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

## Cloud Deployment

### Backend → Render.com

1. Go to https://render.com and create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `GROQ_API_KEY = your_key_here`
5. Deploy — Render auto-generates a URL like `https://supportgenie.onrender.com`

### Frontend → Vercel

1. Go to https://vercel.com and import your GitHub repository
2. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable: `VITE_API_BASE_URL = https://your-render-backend-url`
4. Deploy

### Frontend → Netlify

1. Go to https://netlify.com → "Add new site" → "Import from Git"
2. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Add environment variable: `VITE_API_BASE_URL = https://your-backend-url`
4. Add `frontend/public/_redirects` with:
   ```
   /*    /index.html   200
   ```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Default |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq LLM API key (get free at console.groq.com) | — |
| `FRONTEND_URL` | No | CORS origin for frontend | `http://localhost:5173` |
| `PORT` | No | HTTP server port | `8000` |
| `GROQ_MODEL` | No | Groq model to use | `llama3-8b-8192` |
| `CHROMA_PATH` | No | ChromaDB storage path | `./chroma_db` |

### Frontend (.env)

| Variable | Required | Description | Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | Backend URL | `http://localhost:8000` |

---

## Verify Deployment

After deploying, test these endpoints:

```bash
# Health check
curl https://your-backend/health

# Expected response:
# {"status":"ok","version":"2.0.0","groq_configured":true,"rag_ready":true}

# Test the AI agent
curl -X POST https://your-backend/agent/respond \
  -H "Content-Type: application/json" \
  -d '{"caller_phone": "+1234567890", "message": "Where is my order 1023?"}'
```
