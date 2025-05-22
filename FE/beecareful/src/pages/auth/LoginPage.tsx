import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Login from '@/components/auth/Login';
import Toast from '@/components/common/Toast';
import type { ToastType, ToastPositionType } from '@/components/common/Toast';

// 로케이션 스테이트 타입 정의
type LocationStateType = {
  showToast?: boolean;
  toastMessage?: string;
  toastType?: ToastType;
};

const LoginPage = () => {
  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('middle');
  const [showToast, setShowToast] = useState(false);

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

  const location = useLocation();

  // 페이지 로드 시 location.state에서 토스트 정보 확인
  useEffect(() => {
    const state = location.state as LocationStateType;
    if (state?.showToast && state.toastMessage) {
      showToastMessage(state.toastMessage, 'info', 'middle');

      // 상태 초기화 (새로고침 시 토스트가 다시 나타나지 않도록)
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-300 bg-[url('/images/honeycomb-pattern.png')] bg-cover bg-center">
      <Toast
        message={toastMessage}
        type={toastType}
        position={toastPosition}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <Login />
    </div>
  );
};

export default LoginPage;
