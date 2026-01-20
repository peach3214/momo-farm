import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Ruler, Scale } from 'lucide-react';

interface GrowthChartProps {
  data: Array<{
    date: string;
    height: number | null;
    weight: number | null;
  }>;
}

export const HeightChart = ({ data }: GrowthChartProps) => {
  const chartData = data
    .filter(d => d.height !== null)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'M月', day: 'd日' }),
      height: d.height,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Ruler className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">身長データがありません</p>
      </div>
    );
  }

  const maxHeight = Math.max(...chartData.map(d => d.height || 0));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Ruler className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
          身長の推移
        </h2>
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
                domain={[0, Math.ceil(maxHeight * 1.2)]}
                label={{ value: 'cm', position: 'insideLeft', offset: 10, style: { fontSize: '12px', fill: '#6b7280' } }}
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
                formatter={(value: any) => [`${value} cm`, '身長']}
              />
              <Line 
                type="monotone" 
                dataKey="height" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="身長"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const WeightChart = ({ data }: GrowthChartProps) => {
  const chartData = data
    .filter(d => d.weight !== null)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'M月', day: 'd日' }),
      weight: d.weight,
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Scale className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">体重データがありません</p>
      </div>
    );
  }

  const maxWeight = Math.max(...chartData.map(d => d.weight || 0));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Scale className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          体重の推移
        </h2>
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
                domain={[0, Math.ceil(maxWeight * 1.2)]}
                label={{ value: 'kg', position: 'insideLeft', offset: 10, style: { fontSize: '12px', fill: '#6b7280' } }}
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
                formatter={(value: any) => [`${value} kg`, '体重']}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="体重"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
