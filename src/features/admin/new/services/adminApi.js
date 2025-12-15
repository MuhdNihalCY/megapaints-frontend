import axios from 'axios';
import { getApiUrl } from '../../../../config/api';
import { getAuthToken } from '../../../../utils/api';
import authService from '../../../../utils/authService';

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

// Helper function to get auth token
const getToken = () => {
  // Try multiple sources for the token
  return getAuthToken() || 
         authService.accessToken || 
         localStorage.getItem('accessToken') || 
         localStorage.getItem('admin_access_token') ||
         localStorage.getItem('adminAccessToken');
};

// Column Template API (Kanban)
export const columnTemplateApi = {
  getAll: () => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.get(`${getApiUrl('/kanban/column-templates')}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  getDefault: () => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.get(`${getApiUrl('/kanban/column-templates/default')}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  getById: (id) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.get(`${getApiUrl(`/kanban/column-templates/${id}`)}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  create: (data) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.post(`${getApiUrl('/kanban/column-templates')}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  update: (id, data) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.put(`${getApiUrl(`/kanban/column-templates/${id}`)}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  setDefault: (id) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.put(`${getApiUrl(`/kanban/column-templates/${id}/set-default`)}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  delete: (id) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.delete(`${getApiUrl(`/kanban/column-templates/${id}`)}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
  },
  applyToAllBoards: (templateId) => {
    const token = getToken();
    if (!token) {
      return Promise.reject(new Error('No authentication token found. Please log in.'));
    }
    return axios.post(`${getApiUrl('/kanban/column-templates/apply-to-all-boards')}`, 
      { template_id: templateId },
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      }
    );
  }
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