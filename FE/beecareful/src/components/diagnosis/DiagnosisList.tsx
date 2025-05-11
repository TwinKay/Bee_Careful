import DiagnosisListItem from './DiagnosisListItem';
import type { DiagnosisDataType } from '@/types/diagnosis/diagnosis';

export type DiagnosisListPropsType = {
  data: DiagnosisDataType[];
};
const DiagnosisList: React.FC<DiagnosisListPropsType> = ({ data }) => {
  const sortedData = data.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <div className="flex w-full flex-col gap-8">
      {sortedData.map((data) => (
        <DiagnosisListItem key={data.diagnosisId} {...data} />
      ))}
    </div>
  );
};
export default DiagnosisList;
