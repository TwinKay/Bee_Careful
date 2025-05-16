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
};

export type BeehiveMapRefType = {
  getMapCenter: () => { x: number; y: number };
  refreshMap: () => void;
};

const BeehiveMap = forwardRef<BeehiveMapRefType, BeehiveMapPropsType>((_props, ref) => {
  const [hives, setHives] = useState<BeehiveType[]>([]);
  // 초기 로딩 여부를 추적하는 상태 추가
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // 수동으로 맵 새로고침이 요청되었는지 추적하는 상태 추가
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  // 벌통 상태 팝업 관련 상태
  const [selectedHive, setSelectedHive] = useState<BeehiveType | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
  const [showToast, setShowToast] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: beehives, isLoading, isError, error, refetch } = useGetBeehives();

  const {
    scale,
    draggingId,
    isLongPress,
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
  }));

  // API 응답 데이터가 변경될 때 hives 상태 업데이트
  useEffect(() => {
    if (beehives) {
      // 변환 과정 없이 바로 사용
      setHives(beehives);
    }
  }, [beehives]);

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
    if (beehives && beehives.length > 0 && !initialLoadComplete && !isManualRefresh) {
      centerToHives();
      setInitialLoadComplete(true);
    }
  }, [beehives, centerToHives, initialLoadComplete, isManualRefresh]);

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
            touchAction: 'manipulation',
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
          <MapControls scale={scale} handleZoom={handleZoom} centerToHives={centerToHives} />

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
          />

          {/* 벌통 상태 팝업 */}
          {selectedHive && isPopupOpen && (
            <BeehiveStatusPopup
              isOpen={isPopupOpen}
              onClose={handleCloseStatusPopup}
              hive={selectedHive}
            />
          )}
        </div>
      </div>
    </section>
  );
});

BeehiveMap.displayName = 'BeehiveMap';

export default BeehiveMap;
