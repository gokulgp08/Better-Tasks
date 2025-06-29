import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (task: any) => api.post('/tasks', task),
  update: (id: string, task: any) => api.put(`/tasks/${id}`, task),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (customer: any) => api.post('/customers', customer),
  update: (id: string, customer: any) => api.put(`/customers/${id}`, customer),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const callsAPI = {
  getAll: () => api.get('/calls'),
  getById: (id: string) => api.get(`/calls/${id}`),
  create: (call: any) => api.post('/calls', call),
  update: (id: string, call: any) => api.put(`/calls/${id}`, call),
  delete: (id: string) => api.delete(`/calls/${id}`),
};

export const activityLogsAPI = {
  getAll: () => api.get('/activity-logs'),
};

export const searchAPI = {
  search: (query: string) => api.get(`/search?q=${encodeURIComponent(query)}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read/all'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (user: any) => api.post('/users', user),
  update: (id: string, user: any) => api.put(`/users/${id}`, user),
  delete: (id: string) => api.delete(`/users/${id}`),
};