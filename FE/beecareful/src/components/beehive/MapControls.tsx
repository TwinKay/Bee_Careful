import useBeehiveStore from '@/store/beehiveStore';
import type React from 'react';
import 'remixicon/fonts/remixicon.css';
import { useRef } from 'react';

type MapControlsPropsType = {
  scale: number;
  handleZoom: (newScale: number) => void;
  centerToHives: () => void;
  getMapCenter?: () => { x: number; y: number };
};

const MapControls: React.FC<MapControlsPropsType> = ({
  scale,
  handleZoom,
  centerToHives,
  getMapCenter,
}) => {
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;
  const { currentMode } = useBeehiveStore();
  const resetAttemptRef = useRef(0);

  // 중앙 정렬 함수
  const handleCenterToHives = () => {
    // 최대 시도 횟수 설정
    const maxAttempts = 3;
    resetAttemptRef.current = 0;

    // 중앙 정렬 실행
    const attemptCentering = () => {
      centerToHives();

      // 중앙 정렬 후 필요시 재시도
      setTimeout(() => {
        if (getMapCenter) {
          const center = getMapCenter();
          const distanceFromCenter = Math.sqrt(
            Math.pow(center.x - 1000, 2) + Math.pow(center.y - 1000, 2),
          );

          if (distanceFromCenter > 100 && resetAttemptRef.current < maxAttempts) {
            resetAttemptRef.current++;
            attemptCentering();
          }
        }
      }, 300);
    };

    // 첫 번째 시도 시작
    attemptCentering();
  };

  return (
    <div
      className={`absolute right-2 z-10 flex space-x-2 ${currentMode === 'normal' ? 'bottom-8' : 'bottom-32'}`}
    >
      <button
        onClick={() => handleZoom(Math.min(MAX_SCALE, scale * 1.2))}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
      >
        <i className="ri-zoom-in-line text-lg"></i>
      </button>
      <button
        onClick={() => handleZoom(Math.max(MIN_SCALE, scale / 1.2))}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
      >
        <i className="ri-zoom-out-line text-lg"></i>
      </button>
      <button
        onClick={() => {
          // 먼저 스케일을 1로 설정
          handleZoom(1);
          // 스케일 변경 및 DOM 업데이트가 완료될 시간을 충분히 확보
          setTimeout(() => {
            handleCenterToHives();
          }, 300); // 타이머 시간 증가
        }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
      >
        <i className="ri-refresh-line text-lg"></i>
      </button>
    </div>
  );
};

export default MapControls;
