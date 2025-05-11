import axios from 'axios';

// API URL 설정
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios 인스턴스
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
