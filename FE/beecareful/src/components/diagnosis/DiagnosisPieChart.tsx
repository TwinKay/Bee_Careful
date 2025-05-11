import { PieChart, Pie, Legend, Cell } from 'recharts';
import CustomLegend from './CustomLegend';

export type DiagnosisPieChartPropType = {
  data: {
    name: string;
    value: number;
    ratio: number;
    color: string;
  }[];
};

const DiagnosisPieChart: React.FC<DiagnosisPieChartPropType> = ({ data }) => {
  return (
    <PieChart width={730} height={250}>
      <Pie
        data={data}
        startAngle={90}
        endAngle={-270}
        dataKey="ratio"
        nameKey="name"
        stroke=""
        innerRadius={40}
        outerRadius={80}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Legend content={<CustomLegend />} />
    </PieChart>
  );
};

export default DiagnosisPieChart;
