import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Toggle from '@/components/common/Toggle';
import { useMemo, useState } from 'react';
import { TMP_DIAGNOSIS_DATA } from '@/config/constants';
import Chart from '@/components/diagnosis/Chart';
import CardTitle from '@/components/common/CardTitle';
import DiagnosisList from '@/components/diagnosis/DiagnosisList';

const BeehiveDetailPage = () => {
  const [isToggleLeft, setIsToggleLeft] = useState(true);
  const recentData = useMemo(
    () =>
      TMP_DIAGNOSIS_DATA.filter(
        ({ date }) =>
          new Date(date).getTime() >
          new Date().getTime() - (isToggleLeft ? 6 : 12) * 30 * 24 * 60 * 60 * 1000,
      ),
    [isToggleLeft],
  );

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start p-6">
          <p className="text-lg font-bold">벌통이름10자미만</p>
          <p className="font-semibold text-bc-yellow-100">벌통</p>
        </div>
        <Button disabled className="py-2">
          <p className="font-bold text-gray-600">장치 미연동</p>
        </Button>
      </div>
      <Card className="px-0">
        <CardTitle title="질병 감염 통계" className="px-6" />
        <Toggle
          onToggle={(status) => {
            console.log(status);
            setIsToggleLeft(status);
          }}
          isLeft={isToggleLeft}
          leftLabel="6개월"
          rightLabel="1년"
        />
        <Chart data={recentData} />
      </Card>
      <Card>
        <CardTitle title="질병 검사 결과" />
        <DiagnosisList data={recentData} />
      </Card>
    </>
  );
};
export default BeehiveDetailPage;
