import { Outlet, useNavigate } from 'react-router-dom';
import RemixIcon from '@/components/common/RemixIcon';
import { useState } from 'react';

export type HeaderIconOptionType = {
  title?: string;
  icon?: string;
  onClick?: () => void;
};

const MainLayout = (icon?: string) => {
  const route = useNavigate();
  const [headerIconOption, setHeaderIconOption] = useState<HeaderIconOptionType>({});
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="relative flex h-16 flex-row items-center border-b border-gray-300 bg-white px-4">
        <div className="absolute left-4">
          <RemixIcon name={'ri-arrow-left-s-line'} onClick={() => route(-1)} />
        </div>
        <div className="flex w-full justify-center">
          {headerIconOption.title && (
            <h1 className="text-lg font-bold">{headerIconOption.title}</h1>
          )}
        </div>
        <div className="absolute right-4">
          {icon && <RemixIcon name={icon} onClick={headerIconOption.onClick} />}
        </div>
      </header>
      <div className="flex w-full flex-col items-center gap-4 overflow-y-scroll p-4">
        <Outlet context={{ headerIconOption, setHeaderIconOption }} />
      </div>
    </div>
  );
};

export default MainLayout;
