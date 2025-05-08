import { Outlet, useNavigate } from 'react-router-dom';
import { RiArrowLeftSLine } from '@remixicon/react';
import RemixIcon from '@/components/common/RemixIcon';

const MainLayout = (icon?: string) => {
  const route = useNavigate();
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex flex-row items-center justify-between border-b border-gray-300 bg-white p-4">
        <RiArrowLeftSLine
          size={28}
          onClick={() => {
            route(-1);
          }}
        />
        {icon && <RemixIcon name={icon} />}
      </header>
      <Outlet />
    </div>
  );
};

export default MainLayout;
