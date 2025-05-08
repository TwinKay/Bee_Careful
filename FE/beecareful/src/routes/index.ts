import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import { ROUTES } from '@/config/routes';

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
    ],
  },
]);

export default router;
