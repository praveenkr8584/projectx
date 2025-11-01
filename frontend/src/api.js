import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const api = axios.create({ baseURL });

// Attach token automatically when present
api.interceptors.request.use((config) => {
  // Skip adding token for public routes
  const publicRoutes = ['/register', '/login'];
  const isPublic = publicRoutes.some((route) => config.url.includes(route));

  if (!isPublic) {
    const token = localStorage.getItem('token');
    if (token && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
