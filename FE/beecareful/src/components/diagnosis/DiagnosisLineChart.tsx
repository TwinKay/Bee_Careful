import type { DiagnosisDataType } from '@/types/diagnosis';
import { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CustomLegend from './CustomLegend';

export type ChartPropsType = {
  data: DiagnosisDataType[];
};

const DiagnosisLineChart: React.FC<ChartPropsType> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-lg">
          <p className="label">{`${label}`}</p>

          {payload.map((entry, index) => {
            return (
              <div key={`item-${index}`} className="flex flex-row items-center gap-1">
                <div
                  style={{
                    backgroundColor: entry.color,
                    width: 14,
                    height: 5,
                    marginRight: 4,
                    marginBottom: 3,
                  }}
                ></div>
                <span className="text-sm font-bold text-gray-600">{`${entry.name} : ${entry.value}%`}</span>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const parsedData = useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.createdAt);
      const monthDate = date.toLocaleString('ko-kr', { month: 'long', day: 'numeric' });

      return {
        name: `${monthDate}`,
        '진드기(응애)': item.result.larva.varroaRatio,
        부저병: item.result.larva.foulBroodRatio,
        석고병: item.result.larva.chalkBroodRatio,
        날개바이러스: item.result.imago.dwvRatio,
      };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={parsedData}
        margin={{
          right: 30,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis fontSize={12} fontWeight={'bold'} dataKey="name" />
        <YAxis fontSize={12} />
        <Tooltip
          itemStyle={{ fontSize: 14 }}
          labelStyle={{ fontSize: 14 }}
          contentStyle={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            borderRadius: 12,
          }}
          content={<CustomTooltip />}
        />
        <Legend content={<CustomLegend />} />
        <Line dataKey="진드기(응애)" strokeWidth={2.3} stroke="#E57373" fill="#E57373" />
        <Line dataKey="부저병" strokeWidth={2.3} stroke="#64B5F6" fill="#64B5F6" />
        <Line dataKey="석고병" strokeWidth={2.3} stroke="#81C784" fill="#81C784" />
        <Line dataKey="날개바이러스" strokeWidth={2.3} stroke="#FFB74D" fill="#FFB74D" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DiagnosisLineChart;
