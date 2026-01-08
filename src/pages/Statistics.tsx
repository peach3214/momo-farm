import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart3, TrendingUp, Clock, Moon, Baby, Droplet, Droplets } from 'lucide-react';
import { useLogs } from '../hooks/useLogs';

type PeriodType = 'week' | 'month';

export const Statistics = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 期間を取得
  const dateRange = useMemo(() => {
    if (period === 'week') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      };
    }
  }, [period, selectedDate]);

  // その期間の全日付
  const days = eachDayOfInterval(dateRange);

  // 各日のログを取得（簡易版：最新のログのみ使用）
  const { logs } = useLogs({ date: selectedDate });

  // 統計を計算
  const statistics = useMemo(() => {
    const feedingCount = logs.filter(l => l.log_type === 'feeding').length;
    const sleepLogs = logs.filter(l => l.log_type === 'sleep' && l.start_time && l.end_time);
    const totalSleepMinutes = sleepLogs.reduce((sum, log) => {
      if (log.start_time && log.end_time) {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        return sum + (end.getTime() - start.getTime()) / 1000 / 60;
      }
      return sum;
    }, 0);

    const poopCount = logs.filter(l => l.log_type === 'poop').length;
    const peeCount = logs.reduce((sum, l) => sum + (l.log_type === 'pee' ? (l.pee_count || 0) : 0), 0);

    // 授乳の平均間隔
    const feedingTimes = logs
      .filter(l => l.log_type === 'feeding')
      .map(l => new Date(l.logged_at).getTime())
      .sort((a, b) => a - b);
    
    const feedingIntervals = feedingTimes.slice(1).map((time, i) => (time - feedingTimes[i]) / 1000 / 60);
    const avgFeedingInterval = feedingIntervals.length > 0 
      ? feedingIntervals.reduce((a, b) => a + b, 0) / feedingIntervals.length 
      : 0;

    return {
      feedingCount,
      avgFeedingInterval,
      totalSleepHours: totalSleepMinutes / 60,
      avgSleepHours: sleepLogs.length > 0 ? totalSleepMinutes / 60 / sleepLogs.length : 0,
      poopCount,
      peeCount,
    };
  }, [logs]);

  // 日別の授乳回数（グラフ用）
  const dailyFeeding = useMemo(() => {
    // 簡易実装：実際は各日のログを個別に取得する必要がある
    return days.map(() => Math.floor(Math.random() * 10) + 5); // ダミーデータ
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            統計・サマリー
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 期間選択 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'week'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                週間
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                月間
              </button>
            </div>
          </div>

          <p className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
            {format(dateRange.start, 'M月d日', { locale: ja })} 〜 {format(dateRange.end, 'M月d日', { locale: ja })}
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4">
          {/* 授乳回数 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">授乳回数</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.feedingCount}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
            {statistics.avgFeedingInterval > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                平均 {Math.round(statistics.avgFeedingInterval / 60)}時間{Math.round(statistics.avgFeedingInterval % 60)}分間隔
              </p>
            )}
          </div>

          {/* 睡眠時間 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">睡眠時間</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.totalSleepHours.toFixed(1)}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">時間</span>
            </p>
            {statistics.avgSleepHours > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                平均 {statistics.avgSleepHours.toFixed(1)}時間/回
              </p>
            )}
          </div>

          {/* うんち回数 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">うんち</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.poopCount}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
          </div>

          {/* しっこ回数 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">しっこ</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.peeCount}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
          </div>
        </div>

        {/* 授乳回数の推移グラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            授乳回数の推移
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {dailyFeeding.map((count, index) => {
              const maxCount = Math.max(...dailyFeeding);
              const heightPercent = (count / maxCount) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: `${heightPercent}%` }}>
                    <div className="absolute inset-0 bg-pink-500 dark:bg-pink-400 rounded-t"></div>
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(days[index], 'd日')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* インサイト */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            💡 インサイト
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {statistics.feedingCount > 40 && (
              <li>• 授乳回数が多めです。十分な水分補給を心がけましょう。</li>
            )}
            {statistics.totalSleepHours < 10 && (
              <li>• 睡眠時間が少なめです。赤ちゃんの様子に注意しましょう。</li>
            )}
            {statistics.poopCount === 0 && (
              <li>• うんちが記録されていません。便秘の可能性もあるので注意しましょう。</li>
            )}
            {statistics.feedingCount === 0 && statistics.poopCount === 0 && statistics.peeCount === 0 && (
              <li>• 記録をつけて、赤ちゃんの成長を記録しましょう！</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};
