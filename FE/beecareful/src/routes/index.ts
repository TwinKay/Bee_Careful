import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import { ROUTES } from '@/config/routes';
import MainLayout from '@/layouts/MainLayout';
import DiagnosisCreatePage from '@/pages/diagnosis/DiagnosisCreatePage';
import DiagnosisDetailPage from '@/pages/diagnosis/DiagnosisDetailPage';

const router = createBrowserRouter([
  {
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
      {
        path: ROUTES.DIAGNOSIS_DETAIL,
        Component: () => MainLayout('ri-more-2-fill'),
        children: [
          {
            index: true,
            Component: DiagnosisDetailPage,
          },
        ],
      },
      {
        path: ROUTES.DIAGNOSIS_CREATE,
        Component: () => MainLayout('ri-information-line'),
        children: [
          {
            index: true,
            Component: DiagnosisCreatePage,
          },
        ],
      },
    ],
  },
]);

export default router;
