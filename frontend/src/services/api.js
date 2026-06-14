import axios from 'axios';

// Create an instance of axios with our backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request Interceptor: Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    // 1. Fetch token from browser's localStorage
    const token = localStorage.getItem('token');
    
    // 2. If token exists, inject it into the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;