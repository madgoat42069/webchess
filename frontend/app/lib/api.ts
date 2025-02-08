import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  elo?: number;
}

export const auth = {
  login: async (data: LoginData) => {
    const response = await api.post('/login', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
}; 