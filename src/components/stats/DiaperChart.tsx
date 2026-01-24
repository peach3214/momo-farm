import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Baby } from 'lucide-react';

interface DiaperChartProps {
  data: Array<{
    date: string;
    diaperCount: number;
  }>;
}

export const DiaperChart = ({ data }: DiaperChartProps) => {
  const chartData = data.map(d => ({
    date: format(new Date(d.date), 'M/d', { locale: ja }),
    おむつ: d.diaperCount,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Baby className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">おむつ交換（日別）</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar 
            dataKey="おむつ" 
            fill="#eab308" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
