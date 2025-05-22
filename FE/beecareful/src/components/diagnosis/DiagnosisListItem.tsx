import { useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import DiagnosisDetailPage from '@/pages/diagnosis/DiagnosisDetailPage';
import RemixIcon from '../common/RemixIcon';
import type { DiagnosisDataType } from '@/types/diagnosis';
import { getLocaleDateString } from '@/utils/getLocaleDateString';

const DiagnosisListItem: React.FC<DiagnosisDataType> = (props) => {
  const { createdAt } = props;
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <Card className="cursor-pointer flex-row items-center justify-between bg-gray-100 p-4 py-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <h1 className="font-bold text-bc-yellow-100">질병 검사표</h1>
            <p className="text-xl font-bold">{getLocaleDateString(createdAt)}</p>
          </div>
          <Button size="sm" className="h-fit py-2" onClick={() => setShowDetail(true)}>
            <p className="text-base font-bold">결과보기</p>
          </Button>
        </div>
      </Card>

      {showDetail &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex h-full w-full flex-col bg-gray-50">
            <header className="flex h-16 flex-row items-center justify-between border-b border-gray-300 bg-white p-4">
              <RemixIcon
                name="ri-close-line"
                onClick={() => setShowDetail(false)}
                className="cursor-pointer"
              />
            </header>
            <div className="flex w-full flex-col items-center gap-4 overflow-x-hidden overflow-y-scroll p-4">
              <DiagnosisDetailPage {...props} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DiagnosisListItem;
