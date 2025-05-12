import React, { useRef } from 'react';
import 'remixicon/fonts/remixicon.css';
import beehiveNormal from '/icons/beehive-normal.png';
import beehiveAlert from '/icons/beehive-alert.png';

type HiveCellPropsType = {
  beeHiveId: number;
  nickname: string;
  isInfected: boolean; // alert 상태 결정
  diagnosisStatus?: number | null; // 진단 상태 (0: loading, 1: success, 2: warning)
  lastDiagnosisId?: number | null; // 진단이 있는지 확인용
};

const BeehiveCell: React.FC<HiveCellPropsType> = ({
  beeHiveId,
  nickname,
  isInfected,
  diagnosisStatus,
  lastDiagnosisId,
}) => {
  // 배경 이미지는 isInfected에 따라 결정
  const svgSrc = isInfected ? beehiveAlert : beehiveNormal;

  // 진단 상태가 있고 lastDiagnosisId가 있을 때만 아이콘 표시
  const showDiagnosisIcon = lastDiagnosisId !== null && diagnosisStatus !== null;

  // 진단 아이콘이 있을 때 SVG를 흐리게 처리
  const needsDimmedSvg = showDiagnosisIcon;

  // 롱프레스 타이머 ref
  const longPressTimerRef = useRef<number | null>(null);

  const svgStyle: React.CSSProperties = {
    // iOS Safari 최적화
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // 아이콘이 있을 때 흐림 효과
    ...(needsDimmedSvg && {
      filter: 'opacity(0.4) grayscale(20%)',
      WebkitFilter: 'opacity(0.4) grayscale(20%)',
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

  // 롱프레스 시작 핸들러
  const handleLongPressStart = (_e: React.TouchEvent | React.MouseEvent) => {
    // 기존 타이머가 있으면 제거
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // 1초 후 진동 발생
    longPressTimerRef.current = window.setTimeout(() => {
      triggerVibration();
      longPressTimerRef.current = null;
    }, 1000);
  };

  // 롱프레스 종료 핸들러
  const handleLongPressEnd = () => {
    // 타이머 제거
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 진단 상태에 따른 아이콘 결정
  let statusIcon = null;
  if (showDiagnosisIcon && diagnosisStatus === 0) {
    // loading
    statusIcon = (
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-2 shadow-sm">
          <i className="ri-loader-4-line animate-spin text-3xl text-blue-500"></i>
        </div>
      </div>
    );
  } else if (showDiagnosisIcon && diagnosisStatus === 1) {
    // success
    statusIcon = (
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1 shadow-sm">
          <i className="ri-checkbox-circle-line text-3xl text-green-500"></i>
        </div>
      </div>
    );
  } else if (showDiagnosisIcon && diagnosisStatus === 2) {
    // warning
    statusIcon = (
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1 shadow-sm">
          <i className="ri-information-line text-3xl text-red-500"></i>
        </div>
      </div>
    );
  }

  const containerClass = `relative rounded-xl flex flex-col items-center justify-center h-full w-full p-2`;

  return (
    <div
      className={containerClass}
      style={{
        // 이미지 저장/드래그 방지를 위한 스타일
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()} // 컨텍스트 메뉴 방지
      // 롱프레스 이벤트 추가
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      <div
        className="relative flex w-full items-center justify-center"
        style={{
          WebkitTouchCallout: 'none',
        }}
      >
        {/* 벌통 SVG */}
        <div className="relative flex w-full items-center justify-center">
          <img
            src={svgSrc}
            alt={`beehive ${beeHiveId}`}
            className="h-full w-full"
            style={svgStyle}
            // 이미지 저장 및 드래그 방지
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
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
                // 텍스트 렌더링 최적화
                textRendering: 'optimizeLegibility',
              }}
            >
              {nickname}
            </span>
          </div>
        </div>

        {/* 진단 상태 아이콘 */}
        {statusIcon}
      </div>
    </div>
  );
};

export default BeehiveCell;
