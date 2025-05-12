import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import { ROUTES } from '@/config/routes';
import MainLayout from '@/layouts/MainLayout';
import DiagnosisCreatePage from '@/pages/diagnosis/DiagnosisCreatePage';
import BeehiveListPage from '@/pages/beehive/BeehiveListPage';
import BeehiveDetailPage from '@/pages/beehive/BeehiveDetailPage';

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
        path: ROUTES.BEEHIVES,
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
