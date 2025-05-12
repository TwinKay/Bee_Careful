import { useState, useRef } from 'react';
import BeehiveMap from '@/components/beehive/BeehiveMap';
import Button from '@/components/common/Button';
import { ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';
import BottomSheet from '@/components/common/BottomSheet';
import { useCreateBeehive } from '@/services/beehive';
import type { ToastPositionType, ToastType } from '@/components/common/Toast';
import Toast from '@/components/common/Toast';
import type { BeehiveMapRefType } from '@/components/beehive/BeehiveMap';

const BeehiveListPage = () => {
  // useRef에 타입 명시
  const mapRef = useRef<BeehiveMapRefType>(null);

  // 바텀시트 상태 관리
  const [isNicknameBottomSheetOpen, setIsNicknameBottomSheetOpen] = useState(false);
  const [isDeviceBottomSheetOpen, setIsDeviceBottomSheetOpen] = useState(false);

  // 폼 데이터 상태
  const [beehiveData, setBeehiveData] = useState({
    nickname: '',
    deviceCode: '',
    // 기본적으로 맵의 중앙 좌표로 설정 (실제 맵 크기에 따라 조정 필요)
    xDirection: 10,
    yDirection: 10,
  });

  // 입력 필드 에러 상태
  const [nicknameError, setNicknameError] = useState('');

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
  const [showToast, setShowToast] = useState(false);

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

  // TanStack Query 사용하여 벌통 생성 뮤테이션 설정
  const createBeehiveMutation = useCreateBeehive();

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
      // 현재 맵 중앙 위치 가져오기
      let centerX = beehiveData.xDirection;
      let centerY = beehiveData.yDirection;

      // 맵 참조를 통해 중앙 좌표를 가져올 수 있다면 사용
      if (mapRef.current && typeof mapRef.current.getMapCenter === 'function') {
        const center = mapRef.current.getMapCenter();
        centerX = center.x;
        centerY = center.y;
      }

      // API 요청 데이터 구성
      const beehiveCreateData = {
        nickname: beehiveData.nickname,
        xDirection: centerX,
        yDirection: centerY,
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

      // 맵 새로고침 로직
      if (mapRef.current && typeof mapRef.current.refreshMap === 'function') {
        mapRef.current.refreshMap();
      }
    } catch (error) {
      let errorMessage = '벌통 추가 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToastMessage(errorMessage, 'warning', 'middle');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      <Toast
        message={toastMessage}
        type={toastType}
        position={toastPosition}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      {/* 메인 컨텐츠 영역 */}
      <main className="flex flex-1 flex-col overflow-hidden px-4 lg:flex-row">
        <section>
          {/* 임시버튼 */}
          <Link to={ROUTES.BEEHIVE_DETAIL('1')}>
            <Button size="sm" className="mt-2 flex-1" fullWidth>
              Go to Beehive Detail (id:1)
            </Button>
          </Link>
        </section>
        {/* 벌통 맵 영역 */}
        <section className="h-[80vh] pt-4 lg:h-auto lg:w-2/3">
          <div className="h-full w-full overflow-hidden rounded-lg bg-white">
            <BeehiveMap ref={mapRef} />
          </div>
        </section>
        <section className="absolute bottom-6 left-4 right-4 flex justify-between gap-2">
          <Link to={ROUTES.DIAGNOSIS_CREATE}>
            <Button variant="success" size="xxl">
              질병 검사
            </Button>
          </Link>
          <Button
            onClick={openNicknameBottomSheet}
            variant="neutral"
            size="lg"
            className="flex items-center justify-center"
          >
            <img src="/icons/hive-add.png" alt="보관함" className="h-7 w-8 object-contain" />
          </Button>

          {/* 벌통 별명 입력 바텀시트 */}
          <BottomSheet
            isOpen={isNicknameBottomSheetOpen}
            onClose={closeNicknameBottomSheet}
            title="새로운 벌통을 추가하시겠어요?"
            content="별명을 입력해주세요."
            inputs={[
              {
                id: 'nickname',
                placeholder: '별명',
                type: 'text',
                value: beehiveData.nickname,
                onChange: handleInputChange,
                error: nicknameError,
              },
            ]}
            buttons={[
              {
                id: 'submit',
                label: '추가',
                variant: 'success',
                onClick: handleNicknameSubmit,
              },
            ]}
          />

          {/* 말벌퇴치 연동장치 등록 바텀시트 */}
          <BottomSheet
            isOpen={isDeviceBottomSheetOpen}
            onClose={closeDeviceBottomSheet}
            title="말벌 퇴치 장치를 연동하시겠어요?"
            content="장치 코드를 입력해주세요."
            inputs={[
              {
                id: 'deviceCode',
                placeholder: '장치 코드',
                type: 'text',
                value: beehiveData.deviceCode,
                onChange: handleInputChange,
              },
            ]}
            buttons={[
              {
                id: 'register',
                label: createBeehiveMutation.isPending ? '등록 중...' : '등록하기',
                variant: 'success',
                onClick: () => handleRegisterBeehive(true),
                disabled: createBeehiveMutation.isPending,
              },
              {
                id: 'registerLater',
                label: '다음에 등록하기',
                variant: 'secondary',
                onClick: () => handleRegisterBeehive(false),
                disabled: createBeehiveMutation.isPending,
              },
            ]}
          />
        </section>
      </main>
    </div>
  );
};

export default BeehiveListPage;
