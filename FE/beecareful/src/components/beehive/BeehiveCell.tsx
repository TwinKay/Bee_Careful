import type React from 'react';
import { useRef } from 'react';
import 'remixicon/fonts/remixicon.css';
import beehiveNormal from '/icons/beehive-normal.png';
import beehiveAlert from '/icons/beehive-alert.png';
import type { BeehiveType } from '@/types/beehive';
import useAppStore from '@/store/beehiveStore';

type HiveCellPropsType = {
  hive: BeehiveType;
  onOpenStatusPopup?: (hive: BeehiveType) => void;
  collisionDetected?: boolean;
};

const BeehiveCell: React.FC<HiveCellPropsType> = ({
  hive,
  onOpenStatusPopup,
  collisionDetected = false,
}) => {
  // 앱 상태 스토어에서 현재 모드와 선택된 벌통 ID 가져오기
  const { currentMode, selectedBeehive, setSelectedBeehive } = useAppStore();

  // 현재 벌통이 선택되었는지 확인
  const isSelected = currentMode === 'diagnosis' && selectedBeehive === hive;

  // 진단 모드인지 확인 (드래그 방지용)
  const isDiagnosisMode = currentMode === 'diagnosis';

  // 배경 이미지는 isInfected에 따라 결정
  const svgSrc = hive.isInfected ? beehiveAlert : beehiveNormal;

  // 진단 상태가 있고 lastDiagnosisId가 있을 때만 아이콘 표시
  const showDiagnosisIcon = hive.lastDiagnosisId !== null && hive.diagnosisStatus !== null;

  // 진단 아이콘이 있을 때 SVG를 흐리게 처리
  const needsDimmedSvg = showDiagnosisIcon;

  // 롱프레스 타이머 ref
  const longPressTimerRef = useRef<number | null>(null);
  // 롱프레스 여부 추적
  const isLongPress = useRef<boolean>(false);
  // 드래그 시작 위치 추적
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  // 드래그 중인지 여부 추적
  const isDragging = useRef<boolean>(false);

  const svgStyle: React.CSSProperties = {
    // iOS Safari 최적화
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // 아이콘이 있을 때 흐림 효과
    ...(needsDimmedSvg && {
      WebkitFilter: 'opacity(0.3) grayscale(20%)',
    }),
    pointerEvents: 'auto',
    // 충돌 시 시각적 피드백
    ...(collisionDetected && {
      filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.8))',
      WebkitFilter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.8))',
    }),
  };

  // 진동 함수
  const triggerVibration = () => {
    // 진동 지원 확인
    if ('vibrate' in navigator) {
      // 50ms 진동 - 짧고 부드러운 햅틱 피드백
      navigator.vibrate(50);
    }
  };

  // 모드에 따른 클릭 처리
  const handleCellAction = () => {
    // 드래그 중이면 클릭 동작 무시
    if (isDragging.current) return;

    if (currentMode === 'diagnosis') {
      // 진단 모드에서는 벌통 선택/해제
      if (isSelected) {
        // 이미 선택된 경우 선택 해제
        setSelectedBeehive(null);
      } else {
        // 새로운 벌통 선택
        setSelectedBeehive(hive);
      }
    } else if (onOpenStatusPopup) {
      // 일반 모드에서는 상세 팝업 표시
      onOpenStatusPopup(hive);
    }
  };

  // 클릭/탭 이벤트 핸들러
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 드래그 중이면 클릭 동작 무시
    if (isDragging.current) return;

    handleCellAction();
  };

  // 롱프레스 시작 핸들러
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    // 진단 모드일 때는 롱프레스 기능 비활성화
    if (isDiagnosisMode) return;

    isLongPress.current = false;
    isDragging.current = false;

    // 터치 시작 위치 저장
    if ('touches' in e && e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if ('clientX' in e) {
      touchStartPos.current = {
        x: e.clientX,
        y: e.clientY,
      };
    }

    // 기존 타이머가 있으면 제거
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
    }

    // 1초 후 진동 발생
    longPressTimerRef.current = window.setTimeout(() => {
      triggerVibration();
      isLongPress.current = true;
      longPressTimerRef.current = null;
    }, 1000); // 1초 롱프레스
  };

  // 롱프레스 종료 핸들러
  const handleLongPressEnd = () => {
    // 진단 모드일 때는 롱프레스 종료 처리 건너뛰기
    if (isDiagnosisMode) return;

    // 타이머 제거
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // 상태 초기화
    setTimeout(() => {
      isDragging.current = false;
      touchStartPos.current = null;
    }, 50);
  };

  // 터치 이동 이벤트 처리 (드래그 감지)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDiagnosisMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 드래그 감지 로직 추가
    if (touchStartPos.current && e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

      // 일정 거리 이상 이동했으면 드래그로 간주
      if (deltaX > 5 || deltaY > 5) {
        isDragging.current = true;
      }
    }
  };

  // 마우스 이동 이벤트 처리 (드래그 감지)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDiagnosisMode) return;

    // 드래그 감지 로직 추가
    if (touchStartPos.current) {
      const deltaX = Math.abs(e.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(e.clientY - touchStartPos.current.y);

      // 일정 거리 이상 이동했으면 드래그로 간주
      if (deltaX > 5 || deltaY > 5) {
        isDragging.current = true;
      }
    }
  };

  // 드래그 이벤트 처리 (진단 모드에서 드래그 방지)
  const handleDragStart = (e: React.DragEvent) => {
    if (isDiagnosisMode) {
      e.preventDefault();
      return false;
    }
  };

  // 진단 상태에 따른 아이콘 결정
  let statusIcon = null;
  if (!isSelected) {
    if (showDiagnosisIcon && hive.diagnosisStatus === 0) {
      // loading
      statusIcon = (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
          <div className="flex items-center justify-center rounded-full p-2">
            <i className="ri-loader-4-line animate-spin text-4xl text-blue-400"></i>
          </div>
        </div>
      );
    } else if (showDiagnosisIcon && hive.diagnosisStatus === 1) {
      // success
      statusIcon = (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
          <div className="flex items-center justify-center rounded-full p-1">
            <i className="ri-checkbox-circle-line text-4xl text-green-400"></i>
          </div>
        </div>
      );
    } else if (showDiagnosisIcon && hive.diagnosisStatus === 2) {
      // warning
      statusIcon = (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
          <div className="flex items-center justify-center rounded-full p-1">
            <i className="ri-information-line text-4xl text-red-400"></i>
          </div>
        </div>
      );
    }
  }

  // 선택 상태 아이콘 (진단 모드에서 선택된 경우에만 표시)
  const selectionIcon = isSelected && (
    <>
      {/* 회색 오버레이 */}
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-black/30" />

      {/* 체크 아이콘 */}
      <div className="absolute z-20">
        <div className="flex h-8 w-8 items-center justify-center rounded-full p-1 shadow-sm">
          <i className="ri-check-line text-3xl text-white"></i>
        </div>
      </div>
    </>
  );

  // 진단 모드일 때 추가 스타일 (움직임 방지)
  const diagnosisModeStyle: React.CSSProperties = isDiagnosisMode
    ? {
        // 터치 동작 제한
        touchAction: 'none',
        // 드래그 불가능
        WebkitUserDrag: 'none',
        // 컴포넌트 고정
        position: 'relative',
        cursor: 'pointer',
      }
    : {};

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={{
        // 이미지 저장/드래그 방지를 위한 스타일
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // 진단 모드 추가 스타일
        ...diagnosisModeStyle,
      }}
      onContextMenu={(e) => e.preventDefault()} // 컨텍스트 메뉴 방지
      // 클릭/탭 이벤트 추가
      onClick={handleClick}
      // 롱프레스 이벤트 추가
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      // 드래그 감지를 위한 이벤트 추가
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
      // 드래그 방지
      onDragStart={handleDragStart}
      draggable={!isDiagnosisMode}
    >
      <div
        className="relative flex w-full items-center justify-center"
        style={{
          WebkitTouchCallout: 'none',
          // 진단 모드 추가 스타일
          ...diagnosisModeStyle,
        }}
        // 내부 div에도 클릭 이벤트 추가
        onClick={handleClick}
        // 드래그 방지
        onDragStart={handleDragStart}
        draggable={!isDiagnosisMode}
        // 터치 이동 제한
        onTouchMove={handleTouchMove}
      >
        {/* 벌통 SVG */}
        <div
          className="relative flex w-full items-center justify-center bg-white"
          // 이미지 컨테이너에도 클릭 이벤트 추가
          onClick={handleClick}
          // 드래그 방지
          onDragStart={handleDragStart}
          draggable={!isDiagnosisMode}
          // 터치 이동 제한
          onTouchMove={handleTouchMove}
        >
          <img
            src={svgSrc || '/placeholder.svg'}
            alt={`beehive ${hive.beehiveId}`}
            className="h-full w-full"
            style={{
              ...svgStyle,
              // 진단 모드에서 드래그 방지
              pointerEvents: isDiagnosisMode ? 'auto' : 'auto',
            }}
            // 이미지 저장 및 드래그 방지
            draggable={!isDiagnosisMode}
            onContextMenu={(e) => e.preventDefault()}
            // 이미지 자체에도 클릭 이벤트 추가
            onClick={(e) => {
              e.stopPropagation();
              handleCellAction();
            }}
            // 드래그 방지
            onDragStart={handleDragStart}
            // 터치 이동 제한
            onTouchMove={handleTouchMove}
            // 이미지 최적화를 위한 속성
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              // SVG 로드 실패 시 대체 텍스트 표시 등 처리 가능
            }}
          />

          {/* 벌통 닉네임 텍스트 오버레이 */}
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
            <span
              className="inline-block max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-black"
              style={{
                // iOS에서 폰트 렌더링 최적화
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
              }}
            >
              {hive.nickname}
            </span>
          </div>
        </div>

        {/* 진단 상태 아이콘 */}
        {statusIcon}

        {/* 선택 상태 아이콘 (진단 모드에서만 표시) */}
        {selectionIcon}
      </div>
    </div>
  );
};

export default BeehiveCell;
