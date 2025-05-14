import React from 'react';
import BeehiveCell from '@/components/beehive/BeehiveCell';
import type { BeehiveType } from '@/types/beehive';

type DraggableHivePropsType = {
  hive: BeehiveType;
  scale: number;
  isDragging: boolean;
  isLongPress: boolean;
  hiveSize: number;
  onDragStart: (id: number, e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onOpenStatusPopup: (hive: BeehiveType) => void; // 팝업 열기 함수 추가
};

const DraggableHive: React.FC<DraggableHivePropsType> = ({
  hive,
  scale,
  isDragging,
  isLongPress,
  hiveSize,
  onDragStart,
  onDragEnd,
  onOpenStatusPopup,
}) => {
  return (
    <div
      className={`absolute ${
        isDragging && isLongPress ? 'z-10 ring-2 ring-blue-300 ring-offset-2' : ''
      }`}
      style={{
        position: 'absolute',
        left: `${hive.xDirection * scale}px`,
        top: `${hive.yDirection * scale}px`,
        width: `${hiveSize}px`,
        height: `${hiveSize}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        cursor: isDragging && isLongPress ? 'grabbing' : 'grab',
        transition: 'none',
        willChange: 'transform, left, top',
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        backfaceVisibility: 'hidden',
        perspective: 1000,
        minWidth: `${hiveSize}px`,
        minHeight: `${hiveSize}px`,
        WebkitTransform: `translate3d(0, 0, 0) scale(${scale})`,
        contain: 'strict',
      }}
      onMouseDown={(e) => onDragStart(hive.beehiveId, e)}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          onDragStart(hive.beehiveId, e);
        }
      }}
      onMouseUp={onDragEnd}
      onTouchEnd={onDragEnd}
      onMouseLeave={onDragEnd}
    >
      <BeehiveCell
        hive={hive}
        onOpenStatusPopup={onOpenStatusPopup} // 팝업 열기 함수를 BeehiveCell에 전달
      />
    </div>
  );
};

export default DraggableHive;
