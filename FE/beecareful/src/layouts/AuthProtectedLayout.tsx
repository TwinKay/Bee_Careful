// src/layouts/auth-protected-layout/AuthProtectedLayout.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { setAuthErrorHandler } from '@/services/api';
import { ROUTES } from '@/config/routes';

const AuthProtectedLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 인증 에러 핸들러 설정
    setAuthErrorHandler((_error) => {
      const currentPath = location.pathname;

      // 로그인/회원가입 페이지에서는 리다이렉션 하지 않음
      if (!currentPath.includes(ROUTES.LOGIN) && !currentPath.includes(ROUTES.SIGNUP)) {
        // 로그인 페이지로 리다이렉션
        navigate(ROUTES.LOGIN, {
          state: { from: currentPath },
          replace: true,
        });
      }
    });
  }, [navigate, location]);

  // Outlet을 통해 자식 라우트 렌더링
  return <Outlet />;
};

export default AuthProtectedLayout;
