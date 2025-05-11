import DiagnosisListItem from './DiagnosisListItem';

export type DiagnosisListPropsType = {
  data: {
    id: number;
    date: string;
    '응애(진드기)': number;
    부저병: number;
    석고병: number;
    날개바이러스: number;
  }[];
};
const DiagnosisList: React.FC<DiagnosisListPropsType> = ({ data }) => {
  data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="flex w-full flex-col gap-8">
      {data.map((diagnosis) => (
        <DiagnosisListItem key={diagnosis.id} diagnosis={diagnosis} />
      ))}
    </div>
  );
};
export default DiagnosisList;
