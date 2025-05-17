import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import { ROUTES } from '@/config/routes';
import BottomSheet from '@/components/common/BottomSheet';
import type { BeehiveType } from '@/types/beehive';
import useBeehiveStore from '@/store/beehiveStore';

type BottomAreaPropsType = {
  mode: 'normal' | 'diagnosis';
  selectedBeehive: BeehiveType | null;
  beehiveData: {
    nickname: string;
    deviceCode: string;
  };
  nicknameError: string;
  isNicknameBottomSheetOpen: boolean;
  isDeviceBottomSheetOpen: boolean;
  isPendingCreate: boolean;
  onDiagnosisClick: () => void;
  onCancelDiagnosis: () => void;
  onCompleteDiagnosis: () => boolean;
  onAddBeehiveClick: () => void;
  onCloseNicknameBottomSheet: () => void;
  onCloseDeviceBottomSheet: () => void;
  onNicknameSubmit: () => void;
  onRegisterBeehive: (withDevice: boolean) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const BottomArea = ({
  mode,
  selectedBeehive,
  beehiveData,
  nicknameError,
  isNicknameBottomSheetOpen,
  isDeviceBottomSheetOpen,
  isPendingCreate,
  onDiagnosisClick,
  onCancelDiagnosis,
  onCompleteDiagnosis,
  onAddBeehiveClick,
  onCloseNicknameBottomSheet,
  onCloseDeviceBottomSheet,
  onNicknameSubmit,
  onRegisterBeehive,
  onInputChange,
}: BottomAreaPropsType) => {
  const { setMode } = useBeehiveStore();

  // 진단 모드일 때 UI
  const renderDiagnosisMode = () => (
    <div className="safe-area-bottom w-full px-4 pb-10 pt-4 shadow-lg">
      <div className="mb-8">
        <h2 className="text-bold text-left text-xl font-bold text-bc-brown-100">
          검사를 진행할 벌통을 선택해주세요
        </h2>
        <p
          className={`text-left font-semibold text-gray-500 ${selectedBeehive ? '' : 'invisible'}`}
        >
          선택 벌통:{' '}
          <span className="font-semibold text-bc-brown-100">
            {selectedBeehive?.nickname || 'placeholder'}
          </span>
        </p>
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <Link
            to={selectedBeehive ? ROUTES.DIAGNOSIS_CREATE(selectedBeehive.beehiveId) : '#'}
            onClick={(e) => {
              if (!onCompleteDiagnosis()) {
                e.preventDefault();
              }
              setMode('normal');
            }}
            className="w-full"
          >
            <Button variant="success" size="fixed_xl" fullWidth>
              선택 완료
            </Button>
          </Link>
        </div>
        <div className="w-1/2">
          <Button variant="secondary" size="fixed_xl" onClick={onCancelDiagnosis} fullWidth>
            취소하기
          </Button>
        </div>
      </div>
    </div>
  );

  // 일반 모드일 때 UI
  const renderNormalMode = () => (
    <section className="safe-area-bottom flex justify-between gap-4 pt-4">
      <Button onClick={onDiagnosisClick} variant="success" size="fixed_xxl" fullWidth>
        질병 검사
      </Button>
      <Button
        onClick={onAddBeehiveClick}
        variant="neutral"
        size="md"
        className="flex items-center justify-center"
      >
        <img src="/icons/hive-add.png" alt="벌통 추가" className="h-full w-12 object-contain" />
      </Button>
    </section>
  );

  return (
    <>
      {/* 모드에 따른 하단 영역 렌더링 */}
      <div className={`w-full ${mode === 'diagnosis' ? 'absolute bottom-0 left-0 right-0' : ''}`}>
        {mode === 'diagnosis' ? renderDiagnosisMode() : renderNormalMode()}
      </div>

      {/* 벌통 별명 입력 바텀시트 */}
      <BottomSheet
        isOpen={isNicknameBottomSheetOpen}
        onClose={onCloseNicknameBottomSheet}
        title="새로운 벌통을 추가하시겠어요?"
        content="별명을 입력해주세요."
        inputs={[
          {
            id: 'nickname',
            placeholder: '별명',
            type: 'text',
            value: beehiveData.nickname,
            onChange: onInputChange,
            error: nicknameError,
          },
        ]}
        buttons={[
          {
            id: 'submit',
            label: '추가',
            variant: 'success',
            onClick: onNicknameSubmit,
          },
        ]}
      />

      {/* 말벌퇴치 연동장치 등록 바텀시트 */}
      <BottomSheet
        isOpen={isDeviceBottomSheetOpen}
        onClose={onCloseDeviceBottomSheet}
        title="말벌 퇴치 장치를 연동하시겠어요?"
        content="장치 코드를 입력해주세요."
        inputs={[
          {
            id: 'deviceCode',
            placeholder: '장치 코드',
            type: 'text',
            value: beehiveData.deviceCode,
            onChange: onInputChange,
          },
        ]}
        buttons={[
          {
            id: 'register',
            label: isPendingCreate ? '등록 중...' : '등록하기',
            variant: 'success',
            onClick: () => onRegisterBeehive(true),
            disabled: isPendingCreate,
          },
          {
            id: 'registerLater',
            label: '다음에 등록하기',
            variant: 'secondary',
            onClick: () => onRegisterBeehive(false),
            disabled: isPendingCreate,
          },
        ]}
      />
    </>
  );
};

export default BottomArea;
