import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';
import { useLogin } from '@/services/auth';

type LoginFormType = {
  username: string;
  password: string;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const onSubmit = async (data: LoginFormType) => {
    try {
      setLoginError(null);

      const requestData = {
        memberLoginId: data.username,
        password: data.password,
      };

      // 로그인 요청
      await loginMutation.mutateAsync(requestData);

      // 로그인 성공시 바로 이동
      navigate(ROUTES.BEEHIVES);
    } catch {
      // 오류 메시지 출력
      setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
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
        isLoading={loginMutation.isPending}
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
