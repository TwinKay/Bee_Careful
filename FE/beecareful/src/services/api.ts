import type { AxiosError } from 'axios';
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

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

// 응답 인터셉터
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

// 비로그인으로 감지 시 로그인 페이지 리다이렉션
export const useAuthErrorHandling = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 에러 핸들러 설정
    setAuthErrorHandler((_error) => {
      const currentPath = window.location.pathname;

      // 로그인 페이지로 리다이렉션
      navigate(ROUTES.LOGIN, {
        state: { from: currentPath },
        replace: true,
      });
    });

    // 컴포넌트 언마운트 시 핸들러 제거
    return () => {
      setAuthErrorHandler(() => {});
    };
  }, [navigate]);
};
