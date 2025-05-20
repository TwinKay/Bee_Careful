import { Outlet, useNavigate } from 'react-router-dom';
import RemixIcon from '@/components/common/RemixIcon';
import { useState } from 'react';

export type HeaderIconOptionType = {
  title?: string;
  icon?: string;
  onClick?: () => void;
};

const NotificationLayout = (icon?: string) => {
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
      {/* 여기서 p-4 패딩을 제거하고 w-full을 유지합니다 */}
      <div className="flex w-full flex-col overflow-y-scroll">
        <Outlet context={{ headerIconOption, setHeaderIconOption }} />
      </div>
    </div>
  );
};

export default NotificationLayout;
