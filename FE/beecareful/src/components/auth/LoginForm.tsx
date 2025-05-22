import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';
import { useLogin } from '@/apis/auth';
import { useGetFCMToken } from '@/apis/notification';
import type { LoginRequestType } from '@/types/auth';

type LoginFormType = {
  username: string;
  password: string;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const { data: fcmToken } = useGetFCMToken();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const { mutate, isPending } = useLogin();

  // 로그인 API 호출
  const onSubmit = (data: LoginFormType) => {
    // 에러 상태 초기화
    setLoginError(null);

    const requestData: LoginRequestType = {
      memberLoginId: data.username,
      password: data.password,
      fcmToken: fcmToken || '',
    };

    // mutate 함수에 직접 콜백 전달
    mutate(requestData, {
      onSuccess: () => {
        // 로그인 성공 시 수행할 작업
        navigate(ROUTES.BEEHIVES);
      },
      onError: () => {
        // 로그인 실패 시 수행할 작업
        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
      },
    });
  };

  const handleSignUp = () => {
    navigate(ROUTES.SIGNUP);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-2 mt-12">
      <div>
        <input
          type="text"
          placeholder="아이디"
          className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
            errors.username || loginError
              ? 'border-2 border-red-500 focus:border-red-500'
              : 'focus:border-amber-500'
          }`}
          {...register('username', { required: '아이디를 입력해주세요' })}
        />
        {errors.username && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호"
          className={`mt-4 w-full rounded-2xl p-4 text-lg focus:outline-none ${
            errors.password || loginError
              ? 'border-2 border-red-500 focus:border-red-500'
              : 'focus:border-amber-500'
          }`}
          {...register('password', { required: '비밀번호를 입력해주세요' })}
        />
        {errors.password && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{errors.password.message}</p>
        )}

        {/* 로그인 실패 에러 메시지 표시 */}
        {loginError && !errors.password && (
          <p className="ml-1 mt-2 text-start text-sm text-red-500">{loginError}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isPending}
        className="mt-14"
      >
        로그인
      </Button>

      <Button size="lg" variant="secondary" fullWidth onClick={handleSignUp} className="mt-4">
        회원가입
      </Button>
    </form>
  );
};

export default LoginForm;
