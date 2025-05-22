import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import { ROUTES } from '@/config/routes';
import MainLayout from '@/layouts/MainLayout';
import DiagnosisCreatePage from '@/pages/diagnosis/DiagnosisCreatePage';
import BeehiveListPage from '@/pages/beehive/BeehiveListPage';
import BeehiveDetailPage from '@/pages/beehive/BeehiveDetailPage';
import AuthGuardLayout from '@/layouts/AuthGuardLayout';
import NotificationPage from '@/pages/notification/NotificationPage';
import NotificationLayout from '@/layouts/NotificationLayout';

const router = createBrowserRouter([
  {
    // 인증이 필요없는 페이지들 (로그인, 회원가입)
    path: '/',
    children: [
      {
        path: ROUTES.LOGIN,
        Component: LoginPage,
      },
      {
        path: ROUTES.SIGNUP,
        Component: SignUpPage,
      },
    ],
  },
  {
    // 인증이 필요한 페이지들
    path: '/',
    Component: AuthGuardLayout,
    children: [
      {
        index: true,
        Component: BeehiveListPage,
      },
      {
        path: ROUTES.BEEHIVE_DETAIL(':id'),
        Component: () => MainLayout('ri-more-2-fill'),
        children: [
          {
            index: true,
            Component: BeehiveDetailPage,
          },
        ],
      },
      {
        path: ROUTES.DIAGNOSIS_CREATE(':id'),
        Component: () => MainLayout('ri-information-line'),
        children: [
          {
            index: true,
            Component: DiagnosisCreatePage,
          },
        ],
      },
      {
        path: ROUTES.NOTIFICATIONS,
        Component: () => NotificationLayout(),
        children: [
          {
            index: true,
            Component: NotificationPage,
          },
        ],
      },
    ],
  },
]);

export default router;
