import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Toggle from '@/components/common/Toggle';
import { useMemo, useRef, useState } from 'react';
import { TMP_DIAGNOSIS_API_DATA } from '@/config/constants';
import DiagnosisLineChart from '@/components/diagnosis/DiagnosisLineChart';
import CardTitle from '@/components/common/CardTitle';
import DiagnosisList from '@/components/diagnosis/DiagnosisList';
import { useHeaderIcon } from '@/hooks/useHeaderIcon';
import BottomSheet from '@/components/common/BottomSheet';
import type { HeaderIconOptionType } from '@/layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteBeehive,
  useGetBeehiveRecords,
  useLinkTurret,
  useUpdateBeehive,
} from '@/apis/beehive';
import type { DiagnosisDataType } from '@/types/diagnosis';
import type { ToastPositionType, ToastType } from '@/components/common/Toast';
import { ROUTES } from '@/config/routes';
import Toast from '@/components/common/Toast';
import { useQueryClient } from '@tanstack/react-query';

const BeehiveDetailPage = () => {
  const param = useParams();
  const beehiveId = param.id;
  const navigate = useNavigate();

  const [isToggleLeft, setIsToggleLeft] = useState(true);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLinkTurretOpen, setIsLinkTurretOpen] = useState(false);
  const [isEditTurretOpen, setIsEditTurretOpen] = useState(false);
  const [isDeleteBeehiveOpen, setIsDeleteBeehiveOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isNicknameChanged, setIsNicknameChanged] = useState(false);
  const [turretSerial, setTurretSerial] = useState('');

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastPosition, setToastPosition] = useState<ToastPositionType>('top');
  const [showToast, setShowToast] = useState(false);

  const { mutate: mutateTurret } = useLinkTurret();

  const queryClient = useQueryClient();

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

  const {
    data: beehiveData,
    isError,
    isPending,
  } = useGetBeehiveRecords(Number(beehiveId), isToggleLeft ? 6 : 12);

  // 삭제 mutate 함수
  const { mutate: deleteBeehive } = useDeleteBeehive();

  // 수정 mutate 함수
  const { mutate: updateBeehive } = useUpdateBeehive();

  // 벌통 삭제 핸들러
  const handleDeleteHive = () => {
    deleteBeehive(Number(beehiveId), {
      onSuccess: () => {
        navigate(ROUTES.BEEHIVES, {
          state: {
            showToast: true,
            toastMessage: '벌통이 삭제되었습니다.',
            toastType: 'success',
          },
        });
      },
      onError: (error) => {
        console.log(error);
        showToastMessage('벌통 삭제에 실패하였습니다.', 'warning', 'middle');
      },
    });
  };

  // 별명 수정 핸들러
  const handleUpdateNickname = () => {
    if (!newNickname.trim()) {
      showToastMessage('벌통 별명을 입력해주세요.', 'warning', 'middle');
      return;
    }
    // 현재 위치 정보 유지
    const xDirection = beehiveData?.xDirection || 0;
    const yDirection = beehiveData?.yDirection || 0;
    updateBeehive(
      {
        beeHiveId: Number(beehiveId),
        nickname: newNickname,
        xDirection,
        yDirection,
      },
      {
        onSuccess: () => {
          showToastMessage('벌통 별명이 수정되었습니다.', 'success', 'middle');
          setIsEditNameOpen(false);
          // 변경 감지 상태 리셋
          setIsNicknameChanged(false);
        },
        onError: (error) => {
          console.log(error);
          showToastMessage('벌통 별명 수정에 실패하였습니다.', 'warning', 'middle');
        },
      },
    );
  };

  // 입력 핸들러 추가
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    if (id === 'nickname') {
      setNewNickname(value);
      // 원래 별명과 새 별명이 다른지 확인
      setIsNicknameChanged(value.trim() !== beehiveData?.nickname);
    }
  };

  const recentData = useMemo(
    () =>
      beehiveData
        ? beehiveData.diagnoses.filter(
            ({ createdAt }: DiagnosisDataType) =>
              new Date(createdAt).getTime() >
              new Date().getTime() - (isToggleLeft ? 6 : 12) * 30 * 24 * 60 * 60 * 1000,
          )
        : TMP_DIAGNOSIS_API_DATA.diagnoses.filter(
            ({ createdAt }: DiagnosisDataType) =>
              new Date(createdAt).getTime() >
              new Date().getTime() - (isToggleLeft ? 6 : 12) * 30 * 24 * 60 * 60 * 1000,
          ),
    [isToggleLeft, beehiveData],
  );

  const onIconClick = () => {
    setIsBottomSheetOpen(true);
  };

  const headerOption = useRef<HeaderIconOptionType>({ onClick: onIconClick });

  useHeaderIcon(headerOption);

  // 별명 수정 바텀시트를 열 때 현재 별명으로 초기화
  const openEditNameBottomSheet = () => {
    if (beehiveData) {
      setNewNickname(beehiveData.nickname || '');
      setIsNicknameChanged(false);
    }
    setIsEditNameOpen(true);
  };

  if (!beehiveData || isError || !beehiveId) {
    return <div className="flex h-full w-full items-center justify-center">Error...</div>;
  }

  if (isPending) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  const openLinkTurret = () => {
    setIsEditTurretOpen(true);
  };

  const linkTurret = () => {
    mutateTurret(
      {
        beehiveId: beehiveId,
        serial: turretSerial,
      },
      {
        onSuccess: () => {
          showToastMessage('말벌 퇴치 장치가 연동되었습니다.', 'success', 'middle');
          queryClient.invalidateQueries({
            queryKey: ['beehiveRecords'],
          });
        },
        onError: (error) => {
          console.log(error);
          showToastMessage('말벌 퇴치 장치 연동에 실패하였습니다.', 'warning', 'middle');
        },
      },
    );
  };

  return (
    <>
      {/* Toast 컴포넌트 */}
      <Toast
        message={toastMessage}
        type={toastType}
        position={toastPosition}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="flex w-full items-center justify-between p-4">
        <div className="flex flex-col items-start">
          <p className="text-lg font-bold">{beehiveData.nickname}</p>
          <p className="font-semibold text-bc-yellow-100">벌통</p>
        </div>
        {beehiveData.turretId ? (
          <Button onClick={openLinkTurret} variant="success" className="py-2">
            <p className="text-brown-100 font-bold">장치 연동 중</p>
          </Button>
        ) : (
          <Button
            onClick={openLinkTurret}
            className="bg-gray-300 py-2 hover:bg-gray-300"
            variant="text"
          >
            <p className="font-bold text-gray-600">장치 미연동</p>
          </Button>
        )}
      </div>
      <Card className="px-0">
        <CardTitle className="px-6">질병 감염 통계</CardTitle>
        <Toggle
          onToggle={(status) => {
            setIsToggleLeft(status);
          }}
          isLeft={isToggleLeft}
          leftLabel="6개월"
          rightLabel="1년"
        />
        <DiagnosisLineChart data={recentData} />
      </Card>
      <Card>
        <CardTitle>질병 검사 결과</CardTitle>
        <DiagnosisList data={recentData} />
      </Card>
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="벌통 정보 수정"
        buttons={[
          {
            id: 'edit name',
            label: '별명 수정하기',
            variant: 'neutral',
            onClick: () => {
              setIsBottomSheetOpen(false);
              openEditNameBottomSheet();
            },
          },
          {
            id: 'turret',
            label: '말벌 장치 연동하기',
            variant: 'success',
            onClick: () => {
              setIsBottomSheetOpen(false);
              setIsLinkTurretOpen(true);
            },
          },
          {
            id: 'delete',
            label: '벌통 삭제하기',
            variant: 'secondary',
            onClick: () => {
              setIsBottomSheetOpen(false);
              setIsDeleteBeehiveOpen(true);
            },
          },
        ]}
      />
      <BottomSheet
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
        title="별명 수정"
        content="별명을 입력해주세요."
        inputs={[
          {
            id: 'nickname',
            placeholder: '벌통 별명',
            type: 'text',
            value: newNickname,
            onChange: handleInputChange,
          },
        ]}
        buttons={[
          {
            id: 'edit name',
            label: '수정하기',
            variant: 'success',
            onClick: () => {
              handleUpdateNickname();
            },
            // 별명이 변경되지 않았거나 빈 값일 경우 버튼 비활성화
            disabled: !isNicknameChanged || !newNickname.trim(),
          },
        ]}
      />
      <BottomSheet
        isOpen={isLinkTurretOpen}
        onClose={() => setIsLinkTurretOpen(false)}
        title="말벌 퇴치 장치를 연동하시겠어요?"
        content="신규 등록 시 기존 장치와의 연동이 해제됩니다."
        buttons={[
          {
            id: 'link turret',
            label: '등록하기',
            variant: 'success',
            onClick: () => {
              setIsLinkTurretOpen(false);
              linkTurret();
            },
          },
        ]}
        inputs={[
          {
            id: 'turret serial',
            placeholder: '장치 코드',
            type: 'text',
            value: turretSerial,
            onChange: (e) => {
              setTurretSerial(e.target.value);
            },
          },
        ]}
      />
      <BottomSheet
        isOpen={isEditTurretOpen}
        onClose={() => setIsEditTurretOpen(false)}
        title="말벌 퇴치 장치를 수정하시겠어요?"
        content="신규 등록 시 기존 장치와의 연동이 해제됩니다."
        buttons={[
          {
            id: 'edit turret',
            label: '새로운 말벌 퇴치 장치 연동하기',
            variant: 'success',
            onClick: () => {
              setIsEditTurretOpen(false);
              setIsLinkTurretOpen(true);
            },
          },
          {
            id: 'delete turret',
            label: '말벌 퇴치 장치 해제',
            variant: 'secondary',
            onClick: () => {
              setIsEditTurretOpen(false);
            },
          },
        ]}
      />
      <BottomSheet
        isOpen={isDeleteBeehiveOpen}
        onClose={() => setIsDeleteBeehiveOpen(false)}
        title="벌통 삭제"
        content="정말로 벌통을 삭제하시겠습니까?"
        buttons={[
          {
            id: 'delete beehive',
            label: '삭제하기',
            variant: 'success',
            onClick: () => {
              handleDeleteHive();
              setIsDeleteBeehiveOpen(false);
            },
          },
        ]}
      />
    </>
  );
};
export default BeehiveDetailPage;
