import React from 'react';
import BeehiveCell from '@/components/beehive/BeehiveCell';
import type { HiveType } from './BeehiveMap';

type DraggableHivePropsType = {
  hive: HiveType;
  scale: number;
  isDragging: boolean;
  isLongPress: boolean;
  hiveSize: number;
  onDragStart: (id: number, e: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
};

const DraggableHive: React.FC<DraggableHivePropsType> = ({
  hive,
  scale,
  isDragging,
  isLongPress,
  hiveSize,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <div
      className={`absolute ${
        isDragging && isLongPress ? 'z-10 ring-2 ring-blue-300 ring-offset-2' : ''
      }`}
      style={{
        position: 'absolute',
        left: `${hive.x * scale}px`,
        top: `${hive.y * scale}px`,
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
      onMouseDown={(e) => onDragStart(hive.id, e)}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          onDragStart(hive.id, e);
        }
      }}
      onMouseUp={onDragEnd}
      onTouchEnd={onDragEnd}
      onMouseLeave={onDragEnd}
    >
      <BeehiveCell
        beeHiveId={hive.id}
        nickname={hive.nickname}
        isInfected={hive.isInfected}
        diagnosisStatus={hive.diagnosisStatus}
        lastDiagnosisId={hive.lastDiagnosisId}
      />
    </div>
  );
};

export default DraggableHive;
