import { useCallback } from 'react';
import type React from 'react';
import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Toast from '@/components/common/Toast';
import type { ToastType, ToastPositionType } from '@/components/common/Toast';
import MapControls from './MapControls';
import MapContainer from './MapContainer';
import BeehiveStatusPopup from '@/components/beehive/BeehiveStatusPopup';
import useMapInteractions from '@/hooks/useMapInteractions';
import { useGetBeehives } from '@/apis/beehive';
import type { BeehiveType } from '@/types/beehive';

type BeehiveMapPropsType = {
  _unused?: never;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onScaleChange?: (scale: number) => void;
};

export type BeehiveMapRefType = {
  getMapCenter: () => { x: number; y: number };
  refreshMap: () => void;
  scrollToPosition: (x: number, y: number) => void;
};

const BeehiveMap = forwardRef<BeehiveMapRefType, BeehiveMapPropsType>(
  ({ containerRef: externalContainerRef, onScaleChange }, ref) => {
    const [hives, setHives] = useState<BeehiveType[]>([]);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [isManualRefresh, setIsManualRefresh] = useState(false);

    const [selectedHive, setSelectedHive] = useState<BeehiveType | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('info');
    const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
    const [showToast, setShowToast] = useState(false);

    const internalContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = externalContainerRef || internalContainerRef;

    const { data: beehivesData, isLoading, isError, error, refetch } = useGetBeehives();

    const {
      scale,
      draggingId,
      isLongPress,
      collisionDetected,
      handleZoom,
      handleDragStart,
      handleDrag,
      handleDragEnd,
      centerToHives,
      getMapCenter,
    } = useMapInteractions({
      containerRef,
      hives,
      setHives,
      mapWidth: 2000,
      mapHeight: 2000,
      hiveSize: 100,
    });

    // 특정 위치로 스크롤하는 함수
    const scrollToPosition = useCallback(
      (x: number, y: number) => {
        if (!containerRef.current) {
          // 컨테이너 참조가 없는 경우 조용히 반환
          return;
        }

        // 화면 중앙에 위치하도록 스크롤 위치 계산
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // 스케일 값이 유효한지 확인
        const currentScale = scale > 0 ? scale : 1;

        // 정확한 스크롤 위치 계산
        const scrollLeft = x * currentScale - containerWidth / 2;
        const scrollTop = y * currentScale - containerHeight / 2;

        // 계산된 값이 유효한지 확인
        if (isNaN(scrollLeft) || isNaN(scrollTop)) {
          return;
        }

        // 스크롤 값이 음수가 되지 않도록 조정
        const finalScrollLeft = Math.max(0, scrollLeft);
        const finalScrollTop = Math.max(0, scrollTop);

        // 스크롤 위치가 예상과 크게 다른지 확인하고 필요시 재시도
        setTimeout(() => {
          const center = getMapCenter();
          const distanceFromTarget = Math.sqrt(
            Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2),
          );

          if (distanceFromTarget > 100) {
            // 직접 스크롤 위치 설정으로 재시도
            container.scrollLeft = finalScrollLeft;
            container.scrollTop = finalScrollTop;
          }
        }, 500);

        // 부드러운 스크롤 효과 적용
        try {
          container.scrollTo({
            left: finalScrollLeft,
            top: finalScrollTop,
            behavior: 'smooth',
          });
        } catch {
          // scrollTo가 실패할 경우 대체 방법 사용
          try {
            container.scrollLeft = finalScrollLeft;
            container.scrollTop = finalScrollTop;
          } catch {
            // 대체 스크롤 방법도 실패
          }
        }
      },
      [containerRef, scale, getMapCenter],
    );

    // 스케일 변경 시 외부로 알림
    useEffect(() => {
      if (onScaleChange) {
        onScaleChange(scale);
      }
    }, [scale, onScaleChange]);

    // 팝업 열기 함수
    const handleOpenStatusPopup = (hive: BeehiveType) => {
      setSelectedHive(hive);
      setIsPopupOpen(true);
    };

    // 팝업 닫기 함수
    const handleCloseStatusPopup = () => {
      setIsPopupOpen(false);
    };

    // Toast 표시 함수
    const showToastMessage = (
      message: string,
      type: ToastType = 'info',
      position: ToastPositionType = 'top',
    ) => {
      setToastMessage(message);
      setToastType(type);
      setToastPosition(position);
      setShowToast(true);
    };

    // 맵 새로고침 함수 - 수정된 버전
    const refreshMap = async () => {
      try {
        // 수동 새로고침 플래그 설정
        setIsManualRefresh(true);
        await refetch();
      } catch (refreshError) {
        let errorMessage = '맵 새로고침 중 오류가 발생했습니다.';

        if (refreshError instanceof Error) {
          errorMessage = refreshError.message;
        }

        showToastMessage(errorMessage, 'warning', 'middle');
      } finally {
        // 새로고침 완료 후 플래그 초기화
        setIsManualRefresh(false);
      }
    };

    // ref를 통해 외부에서 접근 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
      getMapCenter,
      refreshMap,
      scrollToPosition,
    }));

    // API 응답 데이터가 변경될 때 hives 상태 업데이트
    useEffect(() => {
      if (beehivesData) {
        setHives(beehivesData);
      }
    }, [beehivesData]);

    // 초기 로딩 시 에러 처리
    useEffect(() => {
      if (isError && error) {
        let errorMessage = '벌통 데이터를 불러오는 중 오류가 발생했습니다.';

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        showToastMessage(errorMessage, 'warning', 'middle');
      }
    }, [isError, error]);

    // 초기 위치 설정 - 수정된 버전
    useEffect(() => {
      // 초기 로딩 시에만 centerToHives 실행
      // isManualRefresh가 true일 때는 벌통 위치로 중앙 이동하지 않음
      if (beehivesData && !initialLoadComplete && !isManualRefresh) {
        // 약간의 지연 후 중앙 정렬 (DOM이 완전히 렌더링된 후)
        setTimeout(() => {
          centerToHives();
          setInitialLoadComplete(true);
        }, 100);
      }
    }, [beehivesData, centerToHives, initialLoadComplete, isManualRefresh]);

    // 로딩 상태 표시
    if (isLoading && !isManualRefresh) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-lg font-medium">벌통 데이터를 불러오는 중...</span>
        </div>
      );
    }

    return (
      <section className="h-[80vh] px-4">
        <div className="h-full w-full overflow-hidden rounded-lg bg-white">
          <div
            className="relative flex h-full w-full flex-col overflow-hidden"
            style={{
              touchAction: 'manipulation', // 터치 동작 최적화
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Toast 컴포넌트 */}
            <Toast
              message={toastMessage}
              type={toastType}
              position={toastPosition}
              isVisible={showToast}
              onClose={() => setShowToast(false)}
            />

            {/* 맵 컨트롤 버튼 */}
            <MapControls
              scale={scale}
              handleZoom={handleZoom}
              centerToHives={centerToHives}
              getMapCenter={getMapCenter}
            />

            {/* 맵 컨테이너 */}
            <MapContainer
              ref={containerRef}
              scale={scale}
              hives={hives}
              draggingId={draggingId}
              isLongPress={isLongPress}
              handleDrag={handleDrag}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              onOpenStatusPopup={handleOpenStatusPopup}
              collisionDetected={collisionDetected}
            />

            {/* 벌통 상태 팝업 */}
            {selectedHive && (
              <BeehiveStatusPopup
                onClose={handleCloseStatusPopup}
                hive={selectedHive}
                isOpen={isPopupOpen}
              />
            )}
          </div>
        </div>
      </section>
    );
  },
);

BeehiveMap.displayName = 'BeehiveMap';

export default BeehiveMap;
