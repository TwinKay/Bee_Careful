import type React from 'react';
import BeehiveCell from '@/components/beehive/BeehiveCell';
import type { BeehiveType } from '@/types/beehive';
import { useRef, useEffect } from 'react';

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

const DraggableHive: React.FC<DraggableHivePropsType> = ({
  hive,
  scale,
  isDragging,
  isLongPress,
  hiveSize,
  onDragStart,
  onDragEnd,
  onOpenStatusPopup,
  collisionDetected = false,
}) => {
  // 드래그 중인지 여부를 추적하는 ref
  const dragInProgress = useRef(false);
  // 컴포넌트 ref 추가
  const hiveRef = useRef<HTMLDivElement>(null);

  // 이미지 관련 이벤트 방지 함수
  const preventImageEvents = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // 드래그 시작 시 상태 업데이트
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('DraggableHive: 드래그 시작');

    // 이미지 선택 방지
    if (e.target instanceof HTMLImageElement) {
      e.preventDefault();
    }

    // 이전 드래그 상태 초기화
    dragInProgress.current = false;

    // 약간의 지연 후 드래그 시작 (이전 드래그 상태가 완전히 초기화되도록)
    setTimeout(() => {
      dragInProgress.current = true;
      onDragStart(hive.beehiveId, e);
    }, 0);
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

  // 이미지 복사 방지를 위한 추가 이벤트 핸들러
  useEffect(() => {
    const componentElement = hiveRef.current;
    if (!componentElement) return;

    // 이미지 요소에 대한 이벤트 처리
    const images = componentElement.querySelectorAll('img');

    // 각 이미지에 이벤트 리스너 추가
    const addImageProtection = () => {
      images.forEach((img) => {
        // TypeScript 오류 방지를 위해 직접 속성 설정
        img.style.setProperty('pointer-events', 'none');
        img.style.setProperty('-webkit-user-drag', 'none');
        img.style.setProperty('-webkit-touch-callout', 'none');
        img.setAttribute('draggable', 'false');
        img.addEventListener('dragstart', preventImageEvents, { capture: true });
        img.addEventListener('contextmenu', preventImageEvents, { capture: true });
        img.addEventListener(
          'touchstart',
          (e) => {
            // 이미지 터치 시 선택 방지, 드래그 로직은 상위 div에서 처리
            if (e.touches.length === 1) {
              e.stopPropagation();
            }
          },
          { passive: false },
        );
      });
    };

    // 컴포넌트 전체에 대한 이벤트 리스너 추가
    componentElement.addEventListener('dragstart', (e) => {
      // 드래그 알림 표시가 활성화된 경우만 기본 드래그 동작 허용
      if (!(isDragging && isLongPress)) {
        e.preventDefault();
      }
    });

    // 이미지 보호 적용
    addImageProtection();

    // 관찰자 설정 - 동적으로 추가된 이미지에도 보호 적용
    const observer = new MutationObserver(() => {
      addImageProtection();
    });

    observer.observe(componentElement, {
      childList: true,
      subtree: true,
    });

    // 드래그 종료 이벤트 리스너 추가
    const handleGlobalDragEnd = () => {
      dragInProgress.current = false;
    };

    // 전역 드래그 종료 이벤트 리스너 등록
    document.addEventListener('beehive-drag-end', handleGlobalDragEnd);

    return () => {
      images.forEach((img) => {
        img.removeEventListener('dragstart', preventImageEvents);
        img.removeEventListener('contextmenu', preventImageEvents);
      });
      observer.disconnect();
      document.removeEventListener('beehive-drag-end', handleGlobalDragEnd);
    };
  }, [isDragging, isLongPress]);

  // 충돌 시 시각적 피드백을 위한 스타일
  const collisionStyle: React.CSSProperties =
    collisionDetected && isDragging && isLongPress
      ? {
          boxShadow: '0 0 0 2px rgba(255, 0, 0, 0.5), 0 0 10px rgba(255, 0, 0, 0.5)',
          transition: 'box-shadow 0.2s ease',
        }
      : {};

  return (
    <div
      ref={hiveRef}
      className={`absolute overflow-hidden rounded-2xl border-2 border-gray-100
         ${isDragging && isLongPress ? 'z-10 ring-2 ring-blue-300 ring-offset-2' : ''}`}
      style={
        {
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
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...collisionStyle, // 충돌 시 스타일 적용
        } as React.CSSProperties
      } // TypeScript 타입 오류 방지
      onMouseDown={handleDragStart}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          handleDragStart(e);
        }
      }}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onContextMenu={(e) => e.preventDefault()}
      draggable={isDragging && isLongPress} // 롱프레스 드래그 중일 때만 draggable 활성화
    >
      <BeehiveCell
        hive={hive}
        onOpenStatusPopup={handleOpenPopup}
        collisionDetected={collisionDetected}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggableHive;
