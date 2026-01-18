import { useMemo } from 'react';
import { useCheckups } from '../hooks/useCheckups';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TrendingUp, Ruler, Scale, Baby } from 'lucide-react';

export const Dashboard = () => {
  const { checkups, loading } = useCheckups();

  const growthData = useMemo(() => {
    return checkups
      .filter(c => c.height_cm || c.weight_g)
      .sort((a, b) => new Date(a.checkup_date).getTime() - new Date(b.checkup_date).getTime())
      .map(c => ({
        date: c.checkup_date,
        height: c.height_cm || null,
        weight: c.weight_g ? c.weight_g / 1000 : null,
      }));
  }, [checkups]);

  const latestData = growthData[growthData.length - 1];

  const maxHeight = Math.ceil(Math.max(...growthData.map(d => d.height || 0)) / 10) * 10 || 100;
  const minHeight = Math.floor(Math.min(...growthData.filter(d => d.height).map(d => d.height || 0)) / 10) * 10 || 0;
  const maxWeight = Math.ceil(Math.max(...growthData.map(d => d.weight || 0))) || 10;
  const minWeight = Math.floor(Math.min(...growthData.filter(d => d.weight).map(d => d.weight || 0))) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            成長ダッシュボード
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {latestData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl shadow-sm p-4 border border-green-100 dark:border-green-900">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">最新の身長</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {latestData.height}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">cm</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(latestData.date), 'yyyy年M月d日', { locale: ja })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl shadow-sm p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">最新の体重</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {latestData.weight?.toFixed(2)}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">kg</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(latestData.date), 'yyyy年M月d日', { locale: ja })}
              </p>
            </div>
          </div>
        )}

        {growthData.some(d => d.height) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-green-600 dark:text-green-400" />
                身長の推移
              </h2>
            </div>
            
            <div className="px-6 pb-6">
              <div className="relative" style={{ height: '280px', paddingLeft: '50px', paddingBottom: '40px' }}>
                {/* Y軸ラベル */}
                <div className="absolute left-0 top-0 bottom-10 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                  {[maxHeight, Math.floor((maxHeight + minHeight) * 0.75), Math.floor((maxHeight + minHeight) * 0.5), Math.floor((maxHeight + minHeight) * 0.25), minHeight].map((val) => (
                    <span key={val} className="text-right">{val}cm</span>
                  ))}
                </div>

                {/* グラフエリア */}
                <div className="absolute left-12 right-0 top-0 bottom-10">
                  <div className="relative h-full border-l border-b border-gray-200 dark:border-gray-700">
                    {/* グリッドライン */}
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <div
                        key={percent}
                        className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                        style={{ top: `${percent}%` }}
                      />
                    ))}

                    {/* 折れ線グラフ */}
                    <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="heightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      
                      {/* エリア */}
                      <path
                        d={`M 0,100% ${growthData
                          .filter(d => d.height)
                          .map((point, index, arr) => {
                            const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                            const yPercent = 100 - (((point.height || 0) - minHeight) / (maxHeight - minHeight)) * 100;
                            return `L ${xPercent}%,${yPercent}%`;
                          })
                          .join(' ')} L 100%,100% Z`}
                        fill="url(#heightGradient)"
                      />
                      
                      {/* ライン */}
                      <polyline
                        fill="none"
                        stroke="rgb(34, 197, 94)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#shadow)"
                        points={growthData
                          .filter(d => d.height)
                          .map((point, index, arr) => {
                            const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                            const yPercent = 100 - (((point.height || 0) - minHeight) / (maxHeight - minHeight)) * 100;
                            return `${xPercent}%,${yPercent}%`;
                          })
                          .join(' ')}
                      />
                      
                      {/* ポイント */}
                      {growthData.filter(d => d.height).map((point, index, arr) => {
                        const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                        const yPercent = 100 - (((point.height || 0) - minHeight) / (maxHeight - minHeight)) * 100;
                        return (
                          <g key={index}>
                            <circle 
                              cx={`${xPercent}%`} 
                              cy={`${yPercent}%`} 
                              r="5" 
                              fill="white" 
                              stroke="rgb(34, 197, 94)" 
                              strokeWidth="3"
                              filter="url(#shadow)"
                            />
                            <text 
                              x={`${xPercent}%`} 
                              y={`${yPercent}%`} 
                              dy="-15" 
                              textAnchor="middle" 
                              fontSize="12" 
                              fontWeight="600" 
                              fill="rgb(34, 197, 94)"
                              className="bg-white dark:bg-gray-800"
                            >
                              {point.height}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* X軸ラベル */}
                <div className="absolute left-12 right-0 bottom-0 h-10 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  {growthData.filter(d => d.height).map((point, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span>{format(new Date(point.date), 'M/d', { locale: ja })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {growthData.some(d => d.weight) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                体重の推移
              </h2>
            </div>
            
            <div className="px-6 pb-6">
              <div className="relative" style={{ height: '280px', paddingLeft: '50px', paddingBottom: '40px' }}>
                <div className="absolute left-0 top-0 bottom-10 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                  {[maxWeight, (maxWeight + minWeight) * 0.75, (maxWeight + minWeight) * 0.5, (maxWeight + minWeight) * 0.25, minWeight].map((val) => (
                    <span key={val} className="text-right">{val.toFixed(1)}kg</span>
                  ))}
                </div>

                <div className="absolute left-12 right-0 top-0 bottom-10">
                  <div className="relative h-full border-l border-b border-gray-200 dark:border-gray-700">
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <div
                        key={percent}
                        className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                        style={{ top: `${percent}%` }}
                      />
                    ))}

                    <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      <path
                        d={`M 0,100% ${growthData
                          .filter(d => d.weight)
                          .map((point, index, arr) => {
                            const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                            const yPercent = 100 - (((point.weight || 0) - minWeight) / (maxWeight - minWeight)) * 100;
                            return `L ${xPercent}%,${yPercent}%`;
                          })
                          .join(' ')} L 100%,100% Z`}
                        fill="url(#weightGradient)"
                      />
                      
                      <polyline
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#shadow)"
                        points={growthData
                          .filter(d => d.weight)
                          .map((point, index, arr) => {
                            const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                            const yPercent = 100 - (((point.weight || 0) - minWeight) / (maxWeight - minWeight)) * 100;
                            return `${xPercent}%,${yPercent}%`;
                          })
                          .join(' ')}
                      />
                      
                      {growthData.filter(d => d.weight).map((point, index, arr) => {
                        const xPercent = (index / Math.max(arr.length - 1, 1)) * 100;
                        const yPercent = 100 - (((point.weight || 0) - minWeight) / (maxWeight - minWeight)) * 100;
                        return (
                          <g key={index}>
                            <circle 
                              cx={`${xPercent}%`} 
                              cy={`${yPercent}%`} 
                              r="5" 
                              fill="white" 
                              stroke="rgb(59, 130, 246)" 
                              strokeWidth="3"
                              filter="url(#shadow)"
                            />
                            <text 
                              x={`${xPercent}%`} 
                              y={`${yPercent}%`} 
                              dy="-15" 
                              textAnchor="middle" 
                              fontSize="12" 
                              fontWeight="600" 
                              fill="rgb(59, 130, 246)"
                            >
                              {point.weight?.toFixed(2)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="absolute left-12 right-0 bottom-0 h-10 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  {growthData.filter(d => d.weight).map((point, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span>{format(new Date(point.date), 'M/d', { locale: ja })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {growthData.length === 0 && (
          <div className="text-center py-12">
            <Baby className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              まだ成長データがありません
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              検診記録で身長・体重を入力すると、成長グラフが表示されます
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
