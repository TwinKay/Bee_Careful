import { Outlet } from 'react-router-dom';
import { useAuthErrorHandling } from '@/services/api';

const AuthGuardLayout = () => {
  // 인증 에러 핸들링 설정
  useAuthErrorHandling();
  return <Outlet />;
};

export default AuthGuardLayout;
