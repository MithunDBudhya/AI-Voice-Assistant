# Deployment Guide

## Local Setup

### Backend
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file and add `GROQ_API_KEY=your_key`
6. Run server: `uvicorn app.main:app --reload`
7. API will run at `http://localhost:8000`

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Create `.env` file and add `VITE_API_BASE_URL=http://localhost:8000`
4. Run server: `npm run dev`
5. App will run at `http://localhost:5173`

---

## Deploying Backend to Render

1. Create a new Web Service on Render, connected to your GitHub repo.
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:**
   - `GROQ_API_KEY`: [your key]
   - `CHROMA_PATH`: `/var/data/chroma`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
6. **Persistent Disk (Crucial for ChromaDB):**
   - Render filesystems are ephemeral. You must attach a persistent disk.
   - Disk Name: `supportgenie-data`
   - Mount Path: `/var/data`
7. The `/health` endpoint serves as the health check.

## Deploying Frontend to Vercel

1. Create a new Project on Vercel, connected to your GitHub repo.
2. Framework Preset: `Vite`
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Environment Variables:**
   - `VITE_API_BASE_URL`: The URL of your Render backend (e.g. `https://supportgenie-backend.onrender.com`)
