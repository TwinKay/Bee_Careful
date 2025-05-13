import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import router from '@/routes';
import NotificationManager from '@/components/notification/NotificationManager';

// QueryClient 인스턴스 생성
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationManager />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
