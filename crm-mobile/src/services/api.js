import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL - replace with your actual backend URL
const API_URL = 'https://dept-action-crm-1.preview.emergentagent.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const activitiesAPI = {
  getAll: (status) => api.get('/activities', { params: status ? { status } : {} }),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  addProgress: (id, data) => api.post(`/activities/${id}/progress`, data),
  delete: (id) => api.delete(`/activities/${id}`),
};

export const locationAPI = {
  updateLocation: (latitude, longitude) => 
    api.post('/locations', { latitude, longitude }),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
};

export default api;
