import { Outlet, useNavigate } from 'react-router-dom';
import RemixIcon from '@/components/common/RemixIcon';

const MainLayout = (icon?: string) => {
  const route = useNavigate();
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex h-16 flex-row items-center justify-between border-b border-gray-300 bg-white p-4">
        <RemixIcon name={'ri-arrow-left-s-line'} onClick={() => route(-1)} />
        {icon && <RemixIcon name={icon} />}
      </header>
      <div className="flex w-full flex-col items-center gap-4 overflow-y-scroll p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
