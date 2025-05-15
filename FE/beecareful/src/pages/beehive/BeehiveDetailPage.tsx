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
import { useParams } from 'react-router-dom';
import { useGetBeehiveRecords } from '@/apis/beehive';
import type { DiagnosisDataType } from '@/types/diagnosis';

const BeehiveDetailPage = () => {
  const param = useParams();
  const beehiveId = param.id;

  const [isToggleLeft, setIsToggleLeft] = useState(true);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLinkTurretOpen, setIsLinkTurretOpen] = useState(false);
  const [isEditTurretOpen, setIsEditTurretOpen] = useState(false);
  const [isDeleteBeehiveOpen, setIsDeleteBeehiveOpen] = useState(false);

  const {
    data: beehiveData,
    isError,
    isPending,
  } = useGetBeehiveRecords(Number(beehiveId), isToggleLeft ? 6 : 12);

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

  if (!beehiveData || isError) {
    return <div className="flex h-full w-full items-center justify-center">Error...</div>;
  }

  if (isPending) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  const linkTurret = () => {
    setIsEditTurretOpen(true);
    console.log('link turret');
  };

  return (
    <>
      <div className="flex w-full items-center justify-between p-4">
        <div className="flex flex-col items-start">
          <p className="text-lg font-bold">{beehiveData.nickname}</p>
          <p className="font-semibold text-bc-yellow-100">벌통</p>
        </div>
        {beehiveData.turretId ? (
          <Button onClick={linkTurret} variant="success" className="py-2">
            <p className="text-brown-100 font-bold">장치 연동 중</p>
          </Button>
        ) : (
          <Button
            onClick={linkTurret}
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
              setIsEditNameOpen(true);
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
          },
        ]}
        buttons={[
          {
            id: 'edit name',
            label: '수정하기',
            variant: 'neutral',
            onClick: () => {
              setIsEditNameOpen(false);
            },
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
            id: 'capture QR',
            label: 'QR 코드 촬영',
            variant: 'neutral',
            onClick: () => {
              setIsLinkTurretOpen(false);
            },
          },
          {
            id: 'link turret',
            label: '등록하기',
            variant: 'success',
            onClick: () => {
              setIsLinkTurretOpen(false);
            },
          },
        ]}
        inputs={[
          {
            id: 'turret code',
            placeholder: '장치 코드',
            type: 'text',
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
              setIsDeleteBeehiveOpen(false);
            },
          },
        ]}
      />
    </>
  );
};
export default BeehiveDetailPage;
