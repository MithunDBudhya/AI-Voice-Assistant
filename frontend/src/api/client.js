import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Intercept errors globally ──────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('[SupportGenie] Backend not reachable — using demo data');
    }
    return Promise.reject(error);
  }
);

// ── Agent ──────────────────────────────────────────────────────
export const simulateCall = async (callerPhone, message) => {
  const response = await apiClient.post('/agent/respond', { caller_phone: callerPhone, message });
  return response.data;
};

// ── Dashboard ──────────────────────────────────────────────────
export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
};

export const getCalls = async () => {
  const response = await apiClient.get('/dashboard/calls');
  return response.data;
};

export const getTickets = async () => {
  const response = await apiClient.get('/dashboard/tickets');
  return response.data;
};

export const getCallbacks = async () => {
  const response = await apiClient.get('/dashboard/callbacks');
  return response.data;
};

export const getDeepAnalytics = async () => {
  const response = await apiClient.get('/dashboard/analytics');
  return response.data;
};

// ── Ticket Actions ─────────────────────────────────────────────
export const updateTicketStatus = async (ticketId, status, resolutionNotes = null) => {
  const response = await apiClient.patch(`/tickets/${ticketId}`, {
    status,
    resolution_notes: resolutionNotes,
  });
  return response.data;
};

// ── Callback Actions ───────────────────────────────────────────
export const updateCallbackStatus = async (callbackId, status) => {
  const response = await apiClient.patch(`/callbacks/${callbackId}`, { status });
  return response.data;
};

// ── RAG ────────────────────────────────────────────────────────
export const ragQuery = async (question) => {
  const response = await apiClient.post('/rag/query', { question });
  return response.data;
};

export const ragIngest = async () => {
  const response = await apiClient.post('/rag/ingest');
  return response.data;
};

export const getDocuments = async () => {
  const response = await apiClient.get('/rag/documents');
  return response.data;
};
