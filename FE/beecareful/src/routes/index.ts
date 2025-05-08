import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import { ROUTES } from '@/config/routes';

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {
        path: ROUTES.LOGIN,
        Component: LoginPage,
      },
    ],
  },
]);

export default router;
