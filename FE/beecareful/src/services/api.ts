import type { AxiosError } from 'axios';
import axios from 'axios';

// API URL 설정
export const API_URL = import.meta.env.VITE_API_URL || 'https://k12a203.p.ssafy.io';

// Axios 인스턴스
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 리다이렉션 핸들러를 위한 콜백 설정
let authErrorHandler: ((error: AxiosError) => void) | null = null;

// 리다이렉션 핸들러 설정 함수
export const setAuthErrorHandler = (handler: (error: AxiosError) => void) => {
  authErrorHandler = handler;
};

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 또는 403 에러가 발생하고 핸들러가 설정되어 있으면 호출
    if ((error.response?.status === 401 || error.response?.status === 403) && authErrorHandler) {
      authErrorHandler(error);
    }

    return Promise.reject(error);
  },
);
