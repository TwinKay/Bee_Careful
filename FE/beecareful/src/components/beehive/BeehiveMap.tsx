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

  // 맵 새로고침 함수
  const refreshMap = async () => {
    try {
      await refetch();
    } catch (refreshError) {
      let errorMessage = '맵 새로고침 중 오류가 발생했습니다.';

      if (refreshError instanceof Error) {
        errorMessage = refreshError.message;
      }

      showToastMessage(errorMessage, 'warning', 'middle');
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

  // 초기 위치 설정
  useEffect(() => {
    // 데이터 로드 후 맵 중앙(벌통 위치)으로 스크롤
    if (beehives && beehives.length > 0) {
      centerToHives();
    }
  }, [beehives, centerToHives]);

  // 로딩 상태 표시
  if (isLoading) {
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
