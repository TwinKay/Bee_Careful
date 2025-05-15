import React, { forwardRef } from 'react';
import DraggableHive from './DraggableHive';
import type { BeehiveType } from '@/types/beehive';

type MapContainerPropsType = {
  scale: number;
  hives: BeehiveType[];
  draggingId: number | null;
  isLongPress: boolean;
  handleDrag: (e: React.MouseEvent | React.TouchEvent) => void;
  handleDragStart: (id: number, e: React.MouseEvent | React.TouchEvent) => void;
  handleDragEnd: () => void;
  onOpenStatusPopup: (hive: BeehiveType) => void; // 팝업 열기 함수 추가
};

const MapContainer = forwardRef<HTMLDivElement, MapContainerPropsType>(
  (
    {
      scale,
      hives,
      draggingId,
      isLongPress,
      handleDrag,
      handleDragStart,
      handleDragEnd,
      onOpenStatusPopup,
    },
    ref,
  ) => {
    const MAP_WIDTH = 2000;
    const MAP_HEIGHT = 2000;
    const HIVE_SIZE = 100;

    return (
      <div
        ref={ref}
        className="map-container relative h-full w-full overflow-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y pinch-zoom',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div
          className="relative"
          style={{
            width: `${MAP_WIDTH * scale}px`,
            height: `${MAP_HEIGHT * scale}px`,
            backgroundImage:
              'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)',
            backgroundSize: `${50 * scale}px ${50 * scale}px`,
          }}
        >
          {hives.map((hive) => (
            <DraggableHive
              key={hive.beehiveId}
              hive={hive}
              scale={scale}
              isDragging={draggingId === hive.beehiveId}
              isLongPress={isLongPress}
              hiveSize={HIVE_SIZE}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onOpenStatusPopup={onOpenStatusPopup} // 팝업 열기 함수 전달
            />
          ))}
        </div>
      </div>
    );
  },
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
