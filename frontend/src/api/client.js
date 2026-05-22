import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const simulateCall = async (callerPhone, message) => {
  const response = await apiClient.post('/agent/respond', {
    caller_phone: callerPhone,
    message,
  });
  return response.data;
};

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

export const ragQuery = async (question) => {
  const response = await apiClient.post('/rag/query', { question });
  return response.data;
};

export const ragIngest = async () => {
  const response = await apiClient.post('/rag/ingest');
  return response.data;
};
