import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const api = axios.create({ baseURL });

// Attach token automatically when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null') {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
