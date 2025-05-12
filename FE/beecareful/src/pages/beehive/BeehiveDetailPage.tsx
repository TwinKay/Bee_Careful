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

const BeehiveDetailPage = () => {
  const [isToggleLeft, setIsToggleLeft] = useState(true);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLinkTurretOpen, setIsLinkTurretOpen] = useState(false);
  const [isDeleteBeehiveOpen, setIsDeleteBeehiveOpen] = useState(false);

  const recentData = useMemo(
    () =>
      TMP_DIAGNOSIS_API_DATA.diagnoses.filter(
        ({ createdAt }) =>
          new Date(createdAt).getTime() >
          new Date().getTime() - (isToggleLeft ? 6 : 12) * 30 * 24 * 60 * 60 * 1000,
      ),
    [isToggleLeft],
  );

  const onIconClick = () => {
    setIsBottomSheetOpen(true);
  };

  const headerOption = useRef<HeaderIconOptionType>({ onClick: onIconClick });

  useHeaderIcon(headerOption);

  return (
    <>
      <div className="flex w-full items-center justify-between p-4">
        <div className="flex flex-col items-start">
          <p className="text-lg font-bold">벌통이름10자미만</p>
          <p className="font-semibold text-bc-yellow-100">벌통</p>
        </div>
        <Button disabled className="py-2">
          <p className="font-bold text-gray-600">장치 미연동</p>
        </Button>
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
