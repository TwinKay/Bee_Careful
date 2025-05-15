import { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning';
export type ToastPositionType = 'top' | 'middle' | 'bottom';

type ToastPropsType = {
  message: string;
  type?: ToastType;
  position?: ToastPositionType;
  duration?: number;
  isVisible?: boolean;
  onClose?: () => void;
};

const Toast: React.FC<ToastPropsType> = ({
  message,
  type = 'info',
  position = 'top',
  duration = 3000,
  isVisible = false,
  onClose,
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!show) return null;

  // 타입별 스타일
  const typeStyles = {
    info: 'bg-black bg-opacity-80 text-white',
    success: 'bg-green-500 bg-opacity-80 text-white',
    warning: 'bg-red-500 bg-opacity-80 text-white',
  };

  // 위치별 스타일
  const positionStyles = {
    top: 'top-5',
    middle: 'top-1/2 transform -translate-y-1/2',
    bottom: 'bottom-4',
  };

  // 애니메이션 스타일
  const animationClasses = show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2';

  return (
    <div
      className={`
        fixed left-1/2 z-50 w-[80%] max-w-md -translate-x-1/2 transform rounded-lg px-3
        py-3 shadow-lg transition-all duration-300 ease-in-out
        ${typeStyles[type]}
        ${positionStyles[position]}
        ${animationClasses}
      `}
    >
      <p className="whitespace-normal break-words text-center text-sm">{message}</p>
    </div>
  );
};

export default Toast;
