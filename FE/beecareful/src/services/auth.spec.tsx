import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from './api';
import type { useSignup, useLogin, SignupRequestType, LoginRequestType } from './auth';

// api 모듈 전체를 목 처리
vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// React Query 테스트용 래퍼
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useSignup', () => {
  const newUser: SignupRequestType = {
    memberLoginId: 'testuser',
    password: 'pass1234',
    memberName: 'Tester',
    phone: '010-1234-5678',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call api.post and succeed', async () => {
    // mockResolvedValue: 비동기 함수의 가짜 성공 반환값 설정
    (api.post as any).mockResolvedValue({ data: { id: 1, ...newUser } });

    const { result, waitFor } = renderHook(() => useSignup(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(newUser);
    });

    // isSuccess가 true가 될 때까지 대기
    await waitFor(() => result.current.isSuccess);

    expect(api.post).toHaveBeenCalledWith('/api/v1/members', newUser);
    expect(result.current.data).toEqual({ id: 1, ...newUser });
  });

  it('should handle error response', async () => {
    const error = { message: 'Username already taken' };
    (api.post as any).mockRejectedValue({ response: { data: error } });

    const { result, waitFor } = renderHook(() => useSignup(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(newUser);
    });

    // isError가 true가 될 때까지 대기
    await waitFor(() => result.current.isError);

    expect(api.post).toHaveBeenCalledWith('/api/v1/members', newUser);
    // error 타입 검증
    expect((result.current.error as any).response.data).toEqual(error);
  });
});

describe('useLogin', () => {
  const credentials: LoginRequestType = {
    memberLoginId: 'testuser',
    password: 'pass1234',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call api.post and succeed', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 'abcd1234' } });

    const { result, waitFor } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => result.current.isSuccess);

    expect(api.post).toHaveBeenCalledWith('/api/v1/members/login', credentials);
    expect(result.current.data).toEqual({ token: 'abcd1234' });
  });

  it('should handle login error', async () => {
    const error: { message: string } = { message: 'Invalid credentials' };
    (api.post as any).mockRejectedValue({ response: { data: error } });

    const { result, waitFor } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(credentials);
    });

    await waitFor(() => result.current.isError);

    expect(api.post).toHaveBeenCalledWith('/api/v1/members/login', credentials);
    expect((result.current.error as any).response.data).toEqual(error);
  });
});
