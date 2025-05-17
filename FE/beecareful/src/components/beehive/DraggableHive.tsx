'use client';

import type React from 'react';
import BeehiveCell from '@/components/beehive/BeehiveCell';
import type { BeehiveType } from '@/types/beehive';
import { useRef } from 'react';

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

// 드래그 중 상세보기 팝업 열림 문제 해결을 위한 코드 수정
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
  // 드래그 중인지 여부를 추적하는 ref 추가
  const dragInProgress = useRef(false);

  // 드래그 시작 시 상태 업데이트
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragInProgress.current = true;
    onDragStart(hive.beehiveId, e);
  };

  // 드래그 종료 시 상태 업데이트
  const handleDragEnd = () => {
    dragInProgress.current = false;
    onDragEnd();
  };

  // 팝업 열기 함수 래핑 - 드래그 중에는 팝업 열지 않음
  const handleOpenPopup = () => {
    if (!dragInProgress.current && !isDragging) {
      onOpenStatusPopup(hive);
    }
  };

  return (
    <div
      className={`absolute ${isDragging && isLongPress ? 'z-10 ring-2 ring-blue-300 ring-offset-2' : ''}`}
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
      onMouseDown={(e) => handleDragStart(e)}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handleDragStart(e);
        }
      }}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <BeehiveCell
        hive={hive}
        onOpenStatusPopup={handleOpenPopup} // 수정된 팝업 열기 함수 전달
      />
    </div>
  );
};

export default DraggableHive;
