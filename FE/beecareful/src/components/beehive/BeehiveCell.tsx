import type React from 'react';
import { useRef, useEffect } from 'react';
import 'remixicon/fonts/remixicon.css';
import beehiveNormal from '/icons/beehive-normal.png';
import beehiveAlert from '/icons/beehive-alert.png';
import type { BeehiveType } from '@/types/beehive';
import useAppStore from '@/store/beehiveStore';

// CSS 타입에 웹킷 접두사 속성 선언
type ExtendedCSSPropertiesType = {
  WebkitUserDrag?: string;
  MozUserDrag?: string;
  userDrag?: string;
  WebkitTouchCallout?: string;
} & React.CSSProperties;

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
  // 이미지 요소 ref 추가
  const imageRef = useRef<HTMLImageElement>(null);

  const svgStyle: ExtendedCSSPropertiesType = {
    // iOS Safari 최적화
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    // 아이콘이 있을 때 흐림 효과
    ...(needsDimmedSvg && {
      WebkitFilter: 'opacity(0.3) grayscale(20%)',
    }),
    pointerEvents: isDiagnosisMode ? 'auto' : 'none', // 진단 모드에서만 직접 클릭 가능
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

    // 이전 상태 초기화
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

    // 롱프레스 시간을 500ms로 단축
    longPressTimerRef.current = window.setTimeout(() => {
      console.log('BeehiveCell: 롱프레스 감지');
      triggerVibration();
      isLongPress.current = true;
      longPressTimerRef.current = null;
    }, 1000);
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

    // 상태 즉시 초기화
    isDragging.current = false;
    isLongPress.current = false;
    touchStartPos.current = null;
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
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // 이미지 보호를 위한 effect 추가
  useEffect(() => {
    const imgElement = imageRef.current;
    if (!imgElement) return;

    // 이미지 요소에 추가 보호 적용
    const applyImageProtection = () => {
      // CSS 프로퍼티를 직접 문자열로 설정 (TypeScript 타입 오류 방지)
      imgElement.style.setProperty('-webkit-user-drag', 'none');
      imgElement.style.setProperty('-webkit-touch-callout', 'none');
      imgElement.draggable = false;

      // 특정 브라우저에서 작동하는 추가 속성
      imgElement.setAttribute('unselectable', 'on');

      // 모바일 롱프레스 메뉴 방지
      imgElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // 이미지 선택 방지
      imgElement.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
      });
    };

    applyImageProtection();

    return () => {
      // 클린업: 이벤트 리스너 제거
      imgElement.removeEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      imgElement.removeEventListener('selectstart', (e) => {
        e.preventDefault();
      });
    };
  }, []);

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
  const diagnosisModeStyle: ExtendedCSSPropertiesType = isDiagnosisMode
    ? {
        // 터치 동작 제한
        touchAction: 'none',
        // 컴포넌트 고정
        position: 'relative',
        cursor: 'pointer',
      }
    : {};

  // 진단 모드일 때 추가 스타일에 웹킷 드래그 방지 추가
  if (isDiagnosisMode && diagnosisModeStyle) {
    // TypeScript 오류 방지를 위해 별도로 설정
    Object.assign(diagnosisModeStyle, {
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={
        {
          // 이미지 저장/드래그 방지를 위한 스타일
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          // 진단 모드 추가 스타일
          ...diagnosisModeStyle,
        } as React.CSSProperties
      }
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
      draggable={false}
    >
      <div
        className="relative flex w-full items-center justify-center"
        style={
          {
            userSelect: 'none',
            pointerEvents: 'auto', // 상위 요소의 이벤트 전파 허용
            // 진단 모드 추가 스타일
            ...diagnosisModeStyle,
          } as React.CSSProperties
        }
        // 내부 div에도 클릭 이벤트 추가
        onClick={handleClick}
        // 드래그 방지
        onDragStart={handleDragStart}
        draggable={false}
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
          draggable={false}
          // 터치 이동 제한
          onTouchMove={handleTouchMove}
        >
          <img
            ref={imageRef}
            src={svgSrc || '/placeholder.svg'}
            alt={`beehive ${hive.beehiveId}`}
            className="h-full w-full select-none"
            style={
              {
                ...svgStyle,
                // 드래그 방지 - TypeScript로 인한 오류를 피하기 위해 as 사용
              } as React.CSSProperties
            }
            // 이미지 저장 및 드래그 방지
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            // 이미지 자체에도 클릭 이벤트 추가
            onClick={(e) => {
              e.stopPropagation();
              handleCellAction();
            }}
            // 드래그 방지 - 명시적 추가
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            // 이미지 선택 방지
            onMouseDown={(e) => {
              // 진단 모드가 아닐 때 이미지 선택 방지
              if (!isDiagnosisMode) {
                e.preventDefault();
              }
            }}
            // 터치 이동 제한
            onTouchMove={(e) => {
              if (!isDiagnosisMode) {
                handleTouchMove(e);
              }
            }}
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
