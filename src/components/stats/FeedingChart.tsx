import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Baby } from 'lucide-react';

interface FeedingChartProps {
  data: Array<{
    date: string;
    breastMinutes: number;
    leftMinutes: number;
    rightMinutes: number;
    feedingCount: number;
  }>;
}

export const FeedingChart = ({ data }: FeedingChartProps) => {
  const chartData = data.map(d => ({
    date: d.date.split('-')[2],
    left: d.leftMinutes,
    right: d.rightMinutes,
  }));

  const maxMinutes = Math.max(
    ...chartData.map(d => Math.max(d.left, d.right)),
    1
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Baby className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" />
          授乳の推移（左右別）
        </h2>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span>左側（分）</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-pink-500"></div>
            <span>右側（分）</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#6b7280' }}
                domain={[0, Math.ceil(maxMinutes * 1.2)]}
                width={30}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number, name: string) => [
                  `${value}分`,
                  name === 'left' ? '左側' : '右側'
                ]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => value === 'left' ? '左側（分）' : '右側（分）'}
              />
              <Line 
                type="monotone" 
                dataKey="left" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="left"
              />
              <Line 
                type="monotone" 
                dataKey="right" 
                stroke="#ec4899" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
