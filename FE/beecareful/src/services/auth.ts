import { api } from './api';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';

// 회원가입 요청 타입
export type SignupRequestType = {
  memberLoginId: string;
  password: string;
  memberName: string;
  phone: string;
};

// 로그인 요청 타입
export type LoginRequestType = {
  memberLoginId: string;
  password: string;
};

// 에러 응답 타입
export type ErrorResponseType = {
  message: string;
};

// 회원가입
export const signup = async (data: SignupRequestType): Promise<void> => {
  try {
    const response = await api.post('/api/v1/members', data);

    // 201: 성공 (바디 없음)
    if (response.status === 201) {
      return;
    }
  } catch (error) {
    // 에러 처리
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 409:
          // 중복 아이디
          throw new Error(error.response.data.message);
        case 400:
          // 유효하지 않은 요청
          throw new Error(error.response.data.message);
        default:
          throw new Error('회원가입 중 오류가 발생했습니다.');
      }
    }

    // 네트워크 에러 등
    console.error('회원가입 에러:', error);
    throw error;
  }
};

// 로그인
export const login = async (data: LoginRequestType): Promise<void> => {
  try {
    const response = await api.post('/api/v1/members/login', data);

    // 200: 성공
    if (response.status === 200) {
      return;
    }
  } catch (error) {
    // 에러 처리
    if (error instanceof AxiosError && error.response) {
      // 로그인 실패 (401 또는 기타 에러)
      throw new Error(error.response.data?.message || '로그인에 실패했습니다.');
    }

    // 네트워크 에러 등
    console.error('로그인 에러:', error);
    throw error;
  }
};

// 회원가입
export function useSignup() {
  return useMutation({
    mutationFn: (newUser: SignupRequestType) =>
      api.post('/api/v1/users', newUser).then((res) => res.data),
  });
}

// 로그인
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequestType) =>
      api.post('/api/v1/users/login', credentials).then((res) => res.data),
  });
}
