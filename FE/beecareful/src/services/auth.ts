import { api } from './api';
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
export function useSignup() {
  return useMutation({
    mutationFn: (newUser: SignupRequestType) =>
      api.post('/api/v1/members', newUser).then((res) => res.data),
  });
}

// 로그인
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequestType) =>
      api.post('/api/v1/members/login', credentials).then((res) => res.data),
  });
}
