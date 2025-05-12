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
      <header className="flex h-16 flex-row items-center justify-between border-b border-gray-300 bg-white p-4">
        <RemixIcon name={'ri-arrow-left-s-line'} onClick={() => route(-1)} />
        {icon && <RemixIcon name={icon} onClick={headerIconOption.onClick} />}
      </header>
      <div className="flex w-full flex-col items-center gap-4 overflow-y-scroll p-4">
        <Outlet context={{ headerIconOption, setHeaderIconOption }} />
      </div>
    </div>
  );
};

export default MainLayout;
