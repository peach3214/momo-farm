import { useMemo } from 'react';
import { useCheckups } from '../hooks/useCheckups';
import { useLogs } from '../hooks/useLogs';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TrendingUp, Calendar, Baby, Ruler, Scale } from 'lucide-react';

export const Dashboard = () => {
  const { checkups, loading } = useCheckups();
  const { logs: allLogs } = useLogs({ date: new Date() });

  // 身長・体重データを取得（検診記録から）
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

  // 最新の身長・体重
  const latestData = growthData[growthData.length - 1];

  // グラフの最大値を計算
  const maxHeight = Math.ceil(Math.max(...growthData.map(d => d.height || 0)) / 10) * 10;
  const maxWeight = Math.ceil(Math.max(...growthData.map(d => d.weight || 0)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            成長ダッシュボード
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* サマリーカード */}
        {latestData && (
          <div className="grid grid-cols-2 gap-4">
            {/* 身長 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  最新の身長
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {latestData.height}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">cm</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(latestData.date), 'yyyy年M月d日', { locale: ja })}
              </p>
            </div>

            {/* 体重 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  最新の体重
                </h3>
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

        {/* 身長グラフ */}
        {growthData.some(d => d.height) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-green-600 dark:text-green-400" />
              身長の推移
            </h2>
            <div className="relative h-64">
              {/* Y軸 */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxHeight, maxHeight * 0.75, maxHeight * 0.5, maxHeight * 0.25, 0].map((val) => (
                  <span key={val}>{Math.round(val)}cm</span>
                ))}
              </div>

              {/* グラフエリア */}
              <div className="absolute left-14 right-0 top-0 bottom-8 border-l border-b border-gray-300 dark:border-gray-600">
                {/* グリッドライン */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div
                    key={percent}
                    className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                    style={{ top: `${percent}%` }}
                  />
                ))}

                {/* データポイント */}
                {growthData.filter(d => d.height).map((point, index) => {
                  const xPercent = (index / (growthData.filter(d => d.height).length - 1)) * 100;
                  const yPercent = 100 - ((point.height || 0) / maxHeight) * 100;

                  return (
                    <div
                      key={point.date}
                      className="absolute"
                      style={{
                        left: `${xPercent}%`,
                        top: `${yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full" />
                    </div>
                  );
                })}

                {/* ライン */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-green-600 dark:text-green-400"
                    points={growthData
                      .filter(d => d.height)
                      .map((point, index) => {
                        const xPercent = (index / (growthData.filter(d => d.height).length - 1)) * 100;
                        const yPercent = 100 - ((point.height || 0) / maxHeight) * 100;
                        return `${xPercent}%,${yPercent}%`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>

              {/* X軸ラベル */}
              <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {growthData.filter(d => d.height).map((point) => (
                  <span key={point.date}>{format(new Date(point.date), 'M/d')}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 体重グラフ */}
        {growthData.some(d => d.weight) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              体重の推移
            </h2>
            <div className="relative h-64">
              {/* Y軸 */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxWeight, maxWeight * 0.75, maxWeight * 0.5, maxWeight * 0.25, 0].map((val) => (
                  <span key={val}>{val.toFixed(1)}kg</span>
                ))}
              </div>

              {/* グラフエリア */}
              <div className="absolute left-14 right-0 top-0 bottom-8 border-l border-b border-gray-300 dark:border-gray-600">
                {/* グリッドライン */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div
                    key={percent}
                    className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                    style={{ top: `${percent}%` }}
                  />
                ))}

                {/* データポイント */}
                {growthData.filter(d => d.weight).map((point, index) => {
                  const xPercent = (index / (growthData.filter(d => d.weight).length - 1)) * 100;
                  const yPercent = 100 - ((point.weight || 0) / maxWeight) * 100;

                  return (
                    <div
                      key={point.date}
                      className="absolute"
                      style={{
                        left: `${xPercent}%`,
                        top: `${yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    </div>
                  );
                })}

                {/* ライン */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-600 dark:text-blue-400"
                    points={growthData
                      .filter(d => d.weight)
                      .map((point, index) => {
                        const xPercent = (index / (growthData.filter(d => d.weight).length - 1)) * 100;
                        const yPercent = 100 - ((point.weight || 0) / maxWeight) * 100;
                        return `${xPercent}%,${yPercent}%`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>

              {/* X軸ラベル */}
              <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {growthData.filter(d => d.weight).map((point) => (
                  <span key={point.date}>{format(new Date(point.date), 'M/d')}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* データがない場合 */}
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
