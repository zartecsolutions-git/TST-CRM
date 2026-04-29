import axios from 'axios';
import { BACKEND_URL } from './backendUrl';

const API_BASE_URL = BACKEND_URL + '/api';

// Send & receive httpOnly auth cookie on EVERY axios call (covers both this
// shared `api` instance and any raw `import axios from 'axios'` usage).
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      const url = error.config?.url || '';
      const path = window.location.pathname || '';
      // Don't redirect if:
      //  - the failing call is the bootstrap /auth/me probe
      //  - we're already on /login or /register (would cause infinite loops)
      const onPublicPage = path === '/login' || path === '/register';
      if (!url.endsWith('/auth/me') && !onPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
