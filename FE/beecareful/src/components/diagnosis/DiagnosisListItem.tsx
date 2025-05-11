import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import { ROUTES } from '@/config/routes';

export type DiagnosisListItemPropsType = {
  diagnosis: {
    id: number;
    date: string;
    '응애(진드기)': number;
    부저병: number;
    석고병: number;
    날개바이러스: number;
  };
};
const DiagnosisListItem: React.FC<DiagnosisListItemPropsType> = ({
  diagnosis: { id, date, '응애(진드기)': mite, 부저병: buzz, 석고병: gypsum, 날개바이러스: virus },
}) => {
  const localeDateString = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
  return (
    <Link to={ROUTES.DIAGNOSIS_DETAIL}>
      <Card className="flex-row items-center justify-between bg-gray-100 p-4 py-4">
        <div className="flex w-full justify-between">
          <div className="flex flex-col items-start gap-1">
            <h1 className="font-bold text-bc-yellow-100">질병 검사표</h1>
            <p className="text-xl font-bold">{localeDateString}</p>
          </div>
          <Button size="sm">
            <p className="text-base font-bold">결과보기</p>
          </Button>
        </div>
      </Card>
    </Link>
  );
};
export default DiagnosisListItem;
