import React from 'react';
import 'remixicon/fonts/remixicon.css';

type MapControlsPropsType = {
  scale: number;
  handleZoom: (newScale: number) => void;
  centerToHives: () => void;
};

const MapControls: React.FC<MapControlsPropsType> = ({ scale, handleZoom, centerToHives }) => {
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;

  return (
    <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
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
          handleZoom(1);
          // 스케일 변경 후 중앙 정렬
          setTimeout(centerToHives, 50);
        }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
      >
        <i className="ri-refresh-line text-lg"></i>
      </button>
    </div>
  );
};

export default MapControls;
