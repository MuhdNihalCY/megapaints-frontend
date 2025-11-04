import axios from 'axios';
import { getApiUrl } from '../../../config/api';

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: getApiUrl('/admin'),
  withCredentials: true, // Important for authentication
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage or context
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('admin_access_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Admin authentication
export const adminAuth = {
  login: (credentials) => adminApi.post('/auth/admin/login', credentials),
  logout: () => adminApi.post('/auth/admin/logout'),
  getProfile: () => adminApi.get('/auth/admin/profile'),
};

// Categories API
export const categoriesApi = {
  getAll: (params) => adminApi.get('/categories', { params }),
  getById: (id) => adminApi.get(`/categories/${id}`),
  create: (data) => adminApi.post('/categories', data),
  update: (id, data) => adminApi.put(`/categories/${id}`, data),
  delete: (id) => adminApi.delete(`/categories/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params) => adminApi.get('/products', { params }),
  getById: (id) => adminApi.get(`/products/${id}`),
  create: (data) => adminApi.post('/products', data),
  update: (id, data) => adminApi.put(`/products/${id}`, data),
  delete: (id) => adminApi.delete(`/products/${id}`),
};

// Additives API
export const additivesApi = {
  getAll: (params) => adminApi.get('/additives', { params }),
  getById: (id) => adminApi.get(`/additives/${id}`),
  create: (data) => adminApi.post('/additives', data),
  update: (id, data) => adminApi.put(`/additives/${id}`, data),
  delete: (id) => adminApi.delete(`/additives/${id}`),
};

// Binders API
export const bindersApi = {
  getAll: (params) => adminApi.get('/binders', { params }),
  getById: (id) => adminApi.get(`/binders/${id}`),
  create: (data) => adminApi.post('/binders', data),
  update: (id, data) => adminApi.put(`/binders/${id}`, data),
  delete: (id) => adminApi.delete(`/binders/${id}`),
};

// Branches API
export const branchesApi = {
  getAll: (params) => adminApi.get('/branches', { params }),
  getById: (id) => adminApi.get(`/branches/${id}`),
  create: (data) => adminApi.post('/branches', data),
  update: (id, data) => adminApi.put(`/branches/${id}`, data),
  delete: (id) => adminApi.delete(`/branches/${id}`),
};

// Users API
export const usersApi = {
  getAll: (params) => adminApi.get('/users', { params }),
  getById: (id) => adminApi.get(`/users/${id}`),
  create: (data) => adminApi.post('/users', data),
  update: (id, data) => adminApi.put(`/users/${id}`, data),
  delete: (id) => adminApi.delete(`/users/${id}`),
};

export default adminApi;