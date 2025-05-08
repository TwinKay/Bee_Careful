import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';

type LoginFormType = {
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const onSubmit = async (data: LoginFormType) => {
    try {
      setIsLoading(true);
      setError(null);
      /**
       * @todo API 개발 완료 후 적용
       */
      console.log(data);
      navigate(ROUTES.BEEHIVES);
    } catch (err) {
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate(ROUTES.SIGNUP);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-300 bg-[url('/images/honeycomb-pattern.png')] bg-cover bg-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src="/icons/beecareful-logo.svg" alt="비케어풀 로고" className="mb-4 w-64" />
          <h1 className="text-bc-brown-90 font-ygJalnan text-5xl font-bold">비케어풀</h1>
          <p className="text-bc-brown-60 mt-2 text-xl font-semibold">꿀벌 통합 관리 시스템</p>
        </div>
        <div className="w-full">
          {error && <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="mx-2 mt-12">
            <div>
              <input
                type="text"
                placeholder="아이디"
                className={`w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.username
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('username', { required: '아이디를 입력해주세요' })}
              />
              {errors.username && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="비밀번호"
                className={`mt-4 w-full rounded-2xl p-4 text-lg focus:outline-none ${
                  errors.password
                    ? 'border-2 border-red-500 focus:border-red-500'
                    : 'focus:border-amber-500'
                }`}
                {...register('password', { required: '비밀번호를 입력해주세요' })}
              />
              {errors.password && (
                <p className="ml-1 mt-2 text-start text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-14"
            >
              로그인
            </Button>

            <Button size="lg" variant="secondary" fullWidth onClick={handleSignUp} className="mt-4">
              회원가입
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
