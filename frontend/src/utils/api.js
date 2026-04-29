import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Send & receive httpOnly auth cookie on EVERY axios call (including raw
// `import axios from 'axios'` usage in legacy pages).
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Legacy fallback: if a token is still in localStorage (during the cookie rollout
// transition), attach it as a Bearer header. Backend prefers the cookie.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const url = error.config?.url || '';
      const path = window.location.pathname || '';
      // Don't redirect if:
      //  - the failing call is the bootstrap /auth/me probe
      //  - we're already on the /login or /register pages (would cause loops)
      const onPublicPage = path === '/login' || path === '/register';
      if (!url.endsWith('/auth/me') && !onPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
