import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import BeehiveMap from '@/components/beehive/BeehiveMap';
import { ROUTES } from '@/config/routes';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ToastPositionType, ToastType } from '@/components/common/Toast';
import Toast from '@/components/common/Toast';
import type { BeehiveMapRefType } from '@/components/beehive/BeehiveMap';
import RemixIcon from '@/components/common/RemixIcon';
import useBeehiveStore from '@/store/beehiveStore';
import BottomArea from '@/components/beehive/BottomArea';
import { useCreateBeehive, useGetBeehives } from '@/apis/beehive';
import { useBeehivePosition } from '@/hooks/useBeehivePosition';
import NotificationBanner from '@/components/notification/NotificationBanner';
import useNotificationStore from '@/store/notificationStore';

// 로케이션 스테이트 타입
type LocationStateType = {
  showToast?: boolean;
  toastMessage?: string;
  toastType?: ToastType;
};

const BeehiveListPage = () => {
  const mapRef = useRef<BeehiveMapRefType>(null);
  const { currentMode, setMode, setSelectedBeehive, selectedBeehive } = useBeehiveStore();

  // 알림 스토어에서 notifications 상태 구독
  const notifications = useNotificationStore((state) => state.notifications);
  const notificationsLengthRef = useRef(notifications.length);

  // 바텀시트 상태 관리
  const [isNicknameBottomSheetOpen, setIsNicknameBottomSheetOpen] = useState(false);
  const [isDeviceBottomSheetOpen, setIsDeviceBottomSheetOpen] = useState(false);

  // 폼 데이터 상태
  const [beehiveData, setBeehiveData] = useState({
    nickname: '',
    deviceCode: '',
    // 기본적으로 맵의 중앙 좌표로 설정 (실제 맵 크기에 따라 조정 필요)
    xDirection: 1000,
    yDirection: 1000,
  });

  // 입력 필드 에러 상태
  const [nicknameError, setNicknameError] = useState('');

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
  const [showToast, setShowToast] = useState(false);

  // API 뮤테이션 훅
  const createBeehiveMutation = useCreateBeehive();
  const { data: beehives = [], refetch: refetchBeehives } = useGetBeehives();
  // 맵 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // 벌통 위치 관련 훅 사용
  const { findOptimalPosition } = useBeehivePosition({ containerRef, scale });

  // 알림 데이터가 변경될 때 벌통 데이터 새로고침
  useEffect(() => {
    // 알림이 새로 추가된 경우에만 벌통 데이터 새로고침
    if (notifications.length > notificationsLengthRef.current) {
      // 벌통 데이터 새로고침
      refetchBeehives();

      // 맵 새로고침
      if (mapRef.current?.refreshMap) {
        mapRef.current.refreshMap();
      }
    }

    // 현재 알림 개수 저장
    notificationsLengthRef.current = notifications.length;
  }, [notifications.length, refetchBeehives]);

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

  // 닉네임 바텀시트 열기
  const openNicknameBottomSheet = () => {
    setIsNicknameBottomSheetOpen(true);
  };

  // 닉네임 바텀시트 닫기
  const closeNicknameBottomSheet = () => {
    setIsNicknameBottomSheetOpen(false);
    // 닉네임 초기화 (선택적)
    setBeehiveData((prev) => ({ ...prev, nickname: '' }));
  };

  // 장치 등록 바텀시트 열기
  const openDeviceBottomSheet = () => {
    setIsDeviceBottomSheetOpen(true);
  };

  // 장치 등록 바텀시트 닫기
  const closeDeviceBottomSheet = () => {
    setIsDeviceBottomSheetOpen(false);
    // 장치 코드 초기화 (선택적)
    setBeehiveData((prev) => ({ ...prev, deviceCode: '' }));
  };

  // 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // 에러 상태 초기화
    if (id === 'nickname') {
      setNicknameError('');
    }

    setBeehiveData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 질병 검사 모드 전환 핸들러
  const handleDiagnosisClick = () => {
    // 앱 모드를 진단 모드로 전환
    setMode('diagnosis');
    // 선택된 벌통 초기화
    setSelectedBeehive(null);
  };

  // 진단 모드 취소 핸들러
  const handleCancelDiagnosis = () => {
    // 앱 모드를 일반 모드로 전환
    setMode('normal');
    // 선택된 벌통 초기화
    setSelectedBeehive(null);
  };

  // 벌통 선택 완료 핸들러
  const handleCompleteDiagnosis = () => {
    if (!selectedBeehive) {
      showToastMessage('벌통을 선택해주세요', 'warning', 'middle');
      return false;
    }
    return true;
  };

  // 별명 등록 후 다음 단계로 진행
  const handleNicknameSubmit = () => {
    // 별명 유효성 검사
    if (!beehiveData.nickname.trim()) {
      setNicknameError('벌통 별명을 입력해주세요.');
      return;
    }

    // 닉네임 바텀시트 닫기
    setIsNicknameBottomSheetOpen(false);

    // 장치 등록 바텀시트 열기
    setTimeout(() => {
      openDeviceBottomSheet();
    }, 300); // 애니메이션을 위한 짧은 지연
  };

  // 장치 등록 여부를 파라미터로 받는 통합 함수
  const handleRegisterBeehive = async (withDevice = false) => {
    try {
      // 최적의 벌통 위치 찾기 (다른 벌통과 충돌하지 않는 위치)
      const optimalPosition = findOptimalPosition(beehives);

      // API 요청 데이터 구성
      const beehiveCreateData = {
        nickname: beehiveData.nickname,
        xDirection: optimalPosition.xDirection,
        yDirection: optimalPosition.yDirection,
      };

      // 장치 등록이 필요한 경우에만 장치 코드 추가
      if (withDevice && beehiveData.deviceCode) {
        Object.assign(beehiveCreateData, { deviceCode: beehiveData.deviceCode });
      }

      // 벌통 생성 API 호출
      await createBeehiveMutation.mutateAsync(beehiveCreateData);

      // 성공 메시지 표시 (장치 등록 여부에 따라 다른 메시지)
      const successMessage = withDevice
        ? '벌통이 성공적으로 추가되었습니다.'
        : '벌통이 성공적으로 추가되었습니다. 장치는 나중에 연동할 수 있습니다.';

      showToastMessage(successMessage, 'success', 'middle');

      // 바텀시트 닫기
      closeDeviceBottomSheet();

      // 폼 데이터 초기화
      setBeehiveData({
        nickname: '',
        deviceCode: '',
        xDirection: 1000,
        yDirection: 1000,
      });

      // 맵 새로고침 후 새 벌통 위치로 스크롤
      if (mapRef.current && typeof mapRef.current.refreshMap === 'function') {
        await mapRef.current.refreshMap();

        // 새로고침 후 새 벌통 위치로 스크롤
        setTimeout(() => {
          if (mapRef.current && typeof mapRef.current.scrollToPosition === 'function') {
            // 항상 새 벌통 위치로 스크롤
            mapRef.current.scrollToPosition(optimalPosition.xDirection, optimalPosition.yDirection);
          }
        }, 800);
      }
    } catch (error) {
      let errorMessage = '벌통 추가 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToastMessage(errorMessage, 'warning', 'middle');
    }
  };

  const location = useLocation();

  const navigate = useNavigate();

  // 알림 페이지로 이동
  const handleViewAllNotifications = () => {
    navigate(ROUTES.NOTIFICATIONS);
  };

  // 페이지 로드 시 location.state에서 토스트 정보 확인
  useEffect(() => {
    const state = location.state as LocationStateType;
    if (state?.showToast && state.toastMessage) {
      showToastMessage(state.toastMessage, state.toastType, 'middle');

      // 상태 초기화 (새로고침 시 토스트가 다시 나타나지 않도록)
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 맵 스케일 업데이트 함수 (BeehiveMap에서 전달받음)
  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        position={toastPosition}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="flex h-screen w-full flex-col justify-around overflow-hidden bg-gray-50">
        <header className="flex items-center justify-between p-4">
          {/* 알림 배너 */}
          <div className="flex-1">
            <NotificationBanner />
          </div>

          {/* 알림 아이콘 버튼 */}
          <button
            onClick={handleViewAllNotifications}
            className="ml-2 flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <RemixIcon name="ri-notification-2-fill" className="text-2xl" />
          </button>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex flex-1 flex-col overflow-hidden px-4 lg:flex-row">
          {/* 벌통 맵 영역 - 진단 모드일 때 하단 영역 공간 확보 */}
          <section
            className={`transition-all duration-300 lg:w-2/3 ${
              currentMode === 'normal' ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-280px)]'
            }`}
          >
            <div className="h-full w-full overflow-hidden rounded-lg bg-white">
              <BeehiveMap
                ref={mapRef}
                containerRef={containerRef}
                onScaleChange={handleScaleChange}
              />
            </div>
          </section>

          {/* 하단 영역 컴포넌트 (바텀시트 포함) */}
          <BottomArea
            mode={currentMode}
            selectedBeehive={selectedBeehive}
            beehiveData={beehiveData}
            nicknameError={nicknameError}
            isNicknameBottomSheetOpen={isNicknameBottomSheetOpen}
            isDeviceBottomSheetOpen={isDeviceBottomSheetOpen}
            isPendingCreate={createBeehiveMutation.isPending}
            onDiagnosisClick={handleDiagnosisClick}
            onCancelDiagnosis={handleCancelDiagnosis}
            onCompleteDiagnosis={handleCompleteDiagnosis}
            onAddBeehiveClick={openNicknameBottomSheet}
            onCloseNicknameBottomSheet={closeNicknameBottomSheet}
            onCloseDeviceBottomSheet={closeDeviceBottomSheet}
            onNicknameSubmit={handleNicknameSubmit}
            onRegisterBeehive={handleRegisterBeehive}
            onInputChange={handleInputChange}
          />
        </main>
      </div>
    </>
  );
};

export default BeehiveListPage;
