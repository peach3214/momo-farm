import { useState, useEffect, useMemo } from 'react';
import { format, subDays, eachDayOfInterval, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart3, Baby, Soup, Droplets, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Log } from '../types/database';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const Statistics = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const weekAgo = subDays(today, 6);
  const days = eachDayOfInterval({ start: weekAgo, end: today });

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const userId = await getUserId();
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .eq('user_id', userId)
          .gte('logged_at', weekAgo.toISOString())
          .lte('logged_at', new Date().toISOString())
          .order('logged_at', { ascending: true });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('ログ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const lastTimes = useMemo(() => {
    const feedingLogs = logs.filter(l => l.log_type === 'feeding');
    const poopLogs = logs.filter(l => l.log_type === 'poop');
    const peeLogs = logs.filter(l => l.log_type === 'pee');

    return {
      feeding: feedingLogs.length > 0 
        ? formatDistanceToNow(new Date(feedingLogs[feedingLogs.length - 1].logged_at), { addSuffix: true, locale: ja })
        : null,
      poop: poopLogs.length > 0 
        ? formatDistanceToNow(new Date(poopLogs[poopLogs.length - 1].logged_at), { addSuffix: true, locale: ja })
        : null,
      pee: peeLogs.length > 0 
        ? formatDistanceToNow(new Date(peeLogs[peeLogs.length - 1].logged_at), { addSuffix: true, locale: ja })
        : null,
    };
  }, [logs]);

  const dailyData = useMemo(() => {
    return days.map(day => {
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at);
        return logDate.toDateString() === day.toDateString();
      });

      const feedingLogs = dayLogs.filter(l => l.log_type === 'feeding');
      const breastFeeding = feedingLogs.filter(l => l.feeding_type !== 'bottle');
      const totalBreastMinutes = breastFeeding.reduce((sum, log) => {
        return sum + (log.feeding_duration_left_min || 0) + (log.feeding_duration_right_min || 0);
      }, 0);

      const poopLogs = dayLogs.filter(l => l.log_type === 'poop');
      const totalPoopAmount = poopLogs.reduce((sum, log) => {
        const amount = log.poop_amount ? parseInt(String(log.poop_amount)) : 0;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const peeLogs = dayLogs.filter(l => l.log_type === 'pee');
      const peeCount = peeLogs.reduce((sum, log) => sum + (log.pee_count || 0), 0);

      return {
        date: day,
        feedingCount: feedingLogs.length,
        breastMinutes: totalBreastMinutes,
        poopCount: poopLogs.length,
        poopAmount: totalPoopAmount,
        peeCount,
      };
    });
  }, [days, logs]);

  const totalStats = useMemo(() => {
    const feedingCount = logs.filter(l => l.log_type === 'feeding').length;
    const breastFeeding = logs.filter(l => l.log_type === 'feeding' && l.feeding_type !== 'bottle');
    const totalBreastMinutes = breastFeeding.reduce((sum, log) => {
      return sum + (log.feeding_duration_left_min || 0) + (log.feeding_duration_right_min || 0);
    }, 0);

    const poopLogs = logs.filter(l => l.log_type === 'poop');
    const poopCount = poopLogs.length;
    const totalPoopAmount = poopLogs.reduce((sum, log) => {
      const amount = log.poop_amount ? parseInt(String(log.poop_amount)) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const peeCount = logs.reduce((sum, l) => sum + (l.log_type === 'pee' ? (l.pee_count || 0) : 0), 0);

    return {
      feedingCount,
      breastHours: totalBreastMinutes / 60,
      avgFeedingPerDay: feedingCount / 7,
      poopCount,
      avgPoopAmount: poopCount > 0 ? totalPoopAmount / poopCount : 0,
      avgPoopPerDay: poopCount / 7,
      peeCount,
      avgPeePerDay: peeCount / 7,
    };
  }, [logs]);

  const maxBreastMinutes = Math.max(...dailyData.map(d => d.breastMinutes), 1);
  const maxFeedingCount = Math.max(...dailyData.map(d => d.feedingCount), 1);
  const maxPoopAmount = Math.max(...dailyData.map(d => d.poopAmount), 1);
  const maxPoopCount = Math.max(...dailyData.map(d => d.poopCount), 1);
  const maxPeeCount = Math.max(...dailyData.map(d => d.peeCount), 1);

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
            <BarChart3 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            週間統計
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {format(weekAgo, 'M月d日', { locale: ja })} 〜 {format(today, 'M月d日', { locale: ja })}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 前回からの経過時間 */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            前回からの経過時間
          </h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">授乳</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lastTimes.feeding || '記録なし'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">うんち</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lastTimes.poop || '記録なし'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">しっこ</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lastTimes.pee || '記録なし'}
              </p>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-xl shadow-sm p-4 border border-pink-100 dark:border-pink-900">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">授乳</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalStats.feedingCount}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              母乳 {totalStats.breastHours.toFixed(1)}h
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-xl shadow-sm p-4 border border-amber-100 dark:border-amber-900">
            <div className="flex items-center gap-2 mb-2">
              <Soup className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">うんち</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalStats.poopCount}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              平均量 {totalStats.avgPoopAmount.toFixed(1)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl shadow-sm p-4 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">しっこ</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalStats.peeCount}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalStats.avgPeePerDay.toFixed(1)}回/日
            </p>
          </div>
        </div>

        {/* 授乳グラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              授乳の推移
            </h2>
            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-pink-400 to-pink-500"></div>
                <span>母乳時間（分）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-pink-600"></div>
                <span>回数</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6">
            <div className="relative h-64" style={{ paddingLeft: '40px', paddingBottom: '30px' }}>
              {/* Y軸ラベル（左：時間、右：回数） */}
              <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxBreastMinutes, Math.floor(maxBreastMinutes * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              {/* グリッドと軸 */}
              <div className="absolute left-10 right-0 top-0 bottom-8">
                <div className="relative h-full border-l border-b border-gray-200 dark:border-gray-700">
                  {/* 水平グリッドライン */}
                  {[0, 33, 67, 100].map((percent) => (
                    <div
                      key={percent}
                      className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                      style={{ top: `${percent}%` }}
                    />
                  ))}

                  {/* 棒グラフ（時間） */}
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {dailyData.map((data, index) => {
                      const heightPercent = (data.breastMinutes / maxBreastMinutes) * 100;
                      return (
                        <div key={index} className="flex-1 mx-1 flex justify-center">
                          <div className="w-full max-w-[32px] relative" style={{ height: '100%' }}>
                            {data.breastMinutes > 0 && (
                              <div 
                                className="absolute bottom-0 w-full bg-gradient-to-t from-pink-500 to-pink-400 dark:from-pink-600 dark:to-pink-500 rounded-t shadow-lg hover:shadow-xl transition-shadow"
                                style={{ height: `${heightPercent}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-pink-600 dark:text-pink-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm">
                                  {data.breastMinutes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 折れ線グラフ（回数） */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(219, 39, 119)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(219, 39, 119)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${dailyData.map((data, index) => {
                        const x = ((index + 0.5) / dailyData.length) * 100;
                        const y = 100 - (data.feedingCount / maxFeedingCount) * 100;
                        return `${x}%,${y}%`;
                      }).join(' L ')} L 100%,100% L 0%,100% Z`}
                      fill="url(#lineGradient)"
                    />
                    <polyline
                      fill="none"
                      stroke="rgb(219, 39, 119)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={dailyData.map((data, index) => {
                        const x = ((index + 0.5) / dailyData.length) * 100;
                        const y = 100 - (data.feedingCount / maxFeedingCount) * 100;
                        return `${x}%,${y}%`;
                      }).join(' ')}
                    />
                    {dailyData.map((data, index) => {
                      const x = ((index + 0.5) / dailyData.length) * 100;
                      const y = 100 - (data.feedingCount / maxFeedingCount) * 100;
                      return (
                        <g key={index}>
                          <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="white" stroke="rgb(219, 39, 119)" strokeWidth="2" />
                          {data.feedingCount > 0 && (
                            <text x={`${x}%`} y={`${y}%`} dy="-12" textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(219, 39, 119)">
                              {data.feedingCount}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* X軸ラベル */}
              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'M/d')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* うんちグラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <Soup className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              うんちの推移
            </h2>
            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-amber-400 to-amber-500"></div>
                <span>量（合計）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-amber-600"></div>
                <span>回数</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6">
            <div className="relative h-64" style={{ paddingLeft: '40px', paddingBottom: '30px' }}>
              <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxPoopAmount, Math.floor(maxPoopAmount * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              <div className="absolute left-10 right-0 top-0 bottom-8">
                <div className="relative h-full border-l border-b border-gray-200 dark:border-gray-700">
                  {[0, 33, 67, 100].map((percent) => (
                    <div
                      key={percent}
                      className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                      style={{ top: `${percent}%` }}
                    />
                  ))}

                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {dailyData.map((data, index) => {
                      const heightPercent = maxPoopAmount > 0 ? (data.poopAmount / maxPoopAmount) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 mx-1 flex justify-center">
                          <div className="w-full max-w-[32px] relative" style={{ height: '100%' }}>
                            {data.poopAmount > 0 && (
                              <div 
                                className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500 rounded-t shadow-lg hover:shadow-xl transition-shadow"
                                style={{ height: `${heightPercent}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm">
                                  {data.poopAmount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="poopLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(217, 119, 6)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(217, 119, 6)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${dailyData.map((data, index) => {
                        const x = ((index + 0.5) / dailyData.length) * 100;
                        const y = maxPoopCount > 0 ? 100 - (data.poopCount / maxPoopCount) * 100 : 100;
                        return `${x}%,${y}%`;
                      }).join(' L ')} L 100%,100% L 0%,100% Z`}
                      fill="url(#poopLineGradient)"
                    />
                    <polyline
                      fill="none"
                      stroke="rgb(217, 119, 6)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={dailyData.map((data, index) => {
                        const x = ((index + 0.5) / dailyData.length) * 100;
                        const y = maxPoopCount > 0 ? 100 - (data.poopCount / maxPoopCount) * 100 : 100;
                        return `${x}%,${y}%`;
                      }).join(' ')}
                    />
                    {dailyData.map((data, index) => {
                      const x = ((index + 0.5) / dailyData.length) * 100;
                      const y = maxPoopCount > 0 ? 100 - (data.poopCount / maxPoopCount) * 100 : 100;
                      return (
                        <g key={index}>
                          <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="white" stroke="rgb(217, 119, 6)" strokeWidth="2" />
                          {data.poopCount > 0 && (
                            <text x={`${x}%`} y={`${y}%`} dy="-12" textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(217, 119, 6)">
                              {data.poopCount}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'M/d')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* しっこグラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              しっこ回数の推移
            </h2>
          </div>
          
          <div className="px-6 pb-6">
            <div className="relative h-56" style={{ paddingLeft: '40px', paddingBottom: '30px' }}>
              <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxPeeCount, Math.floor(maxPeeCount * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              <div className="absolute left-10 right-0 top-0 bottom-8">
                <div className="relative h-full border-l border-b border-gray-200 dark:border-gray-700">
                  {[0, 33, 67, 100].map((percent) => (
                    <div
                      key={percent}
                      className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                      style={{ top: `${percent}%` }}
                    />
                  ))}

                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {dailyData.map((data, index) => {
                      const heightPercent = maxPeeCount > 0 ? (data.peeCount / maxPeeCount) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 mx-1 flex justify-center">
                          <div className="w-full max-w-[32px] relative" style={{ height: '100%' }}>
                            {data.peeCount > 0 && (
                              <div 
                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 rounded-t shadow-lg hover:shadow-xl transition-shadow"
                                style={{ height: `${heightPercent}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm">
                                  {data.peeCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'M/d')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl p-6 border border-purple-100 dark:border-purple-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              💡 インサイト
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {totalStats.avgFeedingPerDay > 10 && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                  <span>授乳回数が多めです（1日平均{totalStats.avgFeedingPerDay.toFixed(1)}回）</span>
                </li>
              )}
              {totalStats.poopCount === 0 && (
                <li className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>うんちが記録されていません。便秘の可能性もあるので注意しましょう。</span>
                </li>
              )}
              {totalStats.avgPoopPerDay < 1 && totalStats.poopCount > 0 && (
                <li className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>うんちの回数が少なめです（1日平均{totalStats.avgPoopPerDay.toFixed(1)}回）</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};
