import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/common/Button';
import { login } from '@/services/auth';
import type { ToastType, ToastPositionType } from '@/components/common/Toast';
import Toast from '@/components/common/Toast';

type LoginFormType = {
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  // Toast 표시 함수
  const showToastMessage = (
    message: string,
    type: ToastType = 'info',
    position: ToastPositionType = 'top',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastPosition(position);
    setShowToast(true);
  };

  const onSubmit = async (data: LoginFormType) => {
    try {
      setIsLoading(true);

      // 백엔드 API 명세에 맞게 데이터 변환
      const requestData = {
        memberLoginId: data.username, // username -> memberLoginId
        password: data.password,
      };

      await login(requestData);

      // 로그인 성공 토스트
      showToastMessage('로그인 성공!', 'success', 'middle');

      // 약간의 지연 후 벌통 페이지로 이동
      setTimeout(() => {
        navigate(ROUTES.BEEHIVES);
      }, 1500);
    } catch (err) {
      // API에서 에러 메시지 처리
      if (err instanceof Error) {
        showToastMessage(err.message, 'warning', 'middle');
      } else {
        showToastMessage(
          '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.',
          'warning',
          'middle',
        );
      }
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
      {/* Toast 컴포넌트 */}
      <Toast
        message={toastMessage}
        type={toastType}
        position={toastPosition}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src="/icons/beecareful-logo.svg" alt="비케어풀 로고" className="mb-4 w-64" />
          <h1 className="font-ygJalnan text-5xl font-bold text-bc-brown-90">비케어풀</h1>
          <p className="mt-2 text-xl font-semibold text-bc-brown-60">꿀벌 통합 관리 시스템</p>
        </div>
        <div className="w-full">
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
