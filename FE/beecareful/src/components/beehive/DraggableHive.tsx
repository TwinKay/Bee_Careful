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
  onOpenStatusPopup: (hive: BeehiveType) => void;
  collisionDetected?: boolean;
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
  collisionDetected = false, // 기본값 false
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

  // 충돌 시 시각적 피드백을 위한 스타일 추가
  const collisionStyle =
    collisionDetected && isDragging && isLongPress
      ? {
          boxShadow: '0 0 0 2px rgba(255, 0, 0, 0.5), 0 0 10px rgba(255, 0, 0, 0.5)',
          transition: 'box-shadow 0.2s ease',
        }
      : {};

  return (
    <div
      className={`absolute ${isDragging && isLongPress ? 'z-10 ring-2 ring-blue-300 ring-offset-2' : ''}`}
      style={{
        position: 'absolute',
        left: `${(hive.xDirection - hiveSize / 2) * scale}px`,
        top: `${(hive.yDirection - hiveSize / 2) * scale}px`,
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
        ...collisionStyle, // 충돌 시 스타일 적용
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
        onOpenStatusPopup={handleOpenPopup}
        collisionDetected={collisionDetected}
      />
    </div>
  );
};

export default DraggableHive;
