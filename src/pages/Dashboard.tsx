import { useMemo } from 'react';
import { useCheckups } from '../hooks/useCheckups';
import { TrendingUp, Ruler, Scale, Baby } from 'lucide-react';
import { HeightChart, WeightChart } from '../components/stats/GrowthCharts';

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
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">最新身長</h3>
              </div>
              {latestData.height ? (
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {latestData.height}
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">cm</span>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">データなし</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl shadow-sm p-4 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">最新体重</h3>
              </div>
              {latestData.weight ? (
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {latestData.weight}
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">kg</span>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">データなし</p>
              )}
            </div>
          </div>
        )}

        <HeightChart data={growthData} />
        <WeightChart data={growthData} />
      </main>
    </div>
  );
};
