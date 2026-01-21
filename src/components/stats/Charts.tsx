import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Soup, Droplets } from 'lucide-react';

interface PoopChartProps {
  data: Array<{
    date: string;
    poopAmount: number;
    poopCount: number;
  }>;
}

interface PeeChartProps {
  data: Array<{
    date: string;
    peeCount: number;
  }>;
}

export const PoopChart = ({ data }: PoopChartProps) => {
  const chartData = data.map(d => ({
    date: d.date.split('-')[2],
    poopAmount: d.poopAmount,
  }));

  const maxPoopAmount = Math.max(...chartData.map(d => d.poopAmount), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Soup className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          うんちの推移
        </h2>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-amber-600"></div>
            <span>量</span>
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
                domain={[0, Math.ceil(maxPoopAmount * 1.2)]}
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
              />
              <Line 
                type="monotone" 
                dataKey="poopAmount" 
                stroke="#d97706" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="量"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const PeeChart = ({ data }: PeeChartProps) => {
  const chartData = data.map(d => ({
    date: d.date.split('-')[2],
    peeCount: d.peeCount,
  }));

  const maxPeeCount = Math.max(...chartData.map(d => d.peeCount), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Droplets className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          しっこの推移
        </h2>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-blue-600"></div>
            <span>回数</span>
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
                domain={[0, Math.ceil(maxPeeCount * 1.2)]}
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
              />
              <Line 
                type="monotone" 
                dataKey="peeCount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
                name="回数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
