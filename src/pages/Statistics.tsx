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
        if (!log.poop_amount) return sum;
        const val = String(log.poop_amount);
        // 古い形式を数値に変換
        if (val === 'small') return sum + 3;
        if (val === 'medium') return sum + 5;
        if (val === 'large') return sum + 8;
        // 数値形式
        const num = parseInt(val);
        return sum + (isNaN(num) ? 0 : num);
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
      if (!log.poop_amount) return sum;
      const val = String(log.poop_amount);
      // 古い形式を数値に変換
      if (val === 'small') return sum + 3;
      if (val === 'medium') return sum + 5;
      if (val === 'large') return sum + 8;
      // 数値形式
      const num = parseInt(val);
      return sum + (isNaN(num) ? 0 : num);
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

        {/* 週間イベントタイムライン */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              週間イベントタイムライン
            </h2>
          </div>
          
          <div className="p-4">
            {/* 時間軸ラベル */}
            <div className="flex items-center gap-3 mb-2 pl-12">
              <div className="flex-1 flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
                <span>0</span>
                <span>6</span>
                <span>12</span>
                <span>18</span>
                <span>24</span>
              </div>
              <div className="w-10"></div>
            </div>

            <div className="space-y-2">
              {days.map((day, dayIndex) => {
                const dayLogs = logs.filter(log => {
                  const logDate = new Date(log.logged_at);
                  return logDate.toDateString() === day.toDateString();
                });

                return (
                  <div key={dayIndex} className="flex items-center gap-3">
                    {/* 日付 */}
                    <div className="flex-shrink-0 w-9 text-right">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {format(day, 'd')}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {format(day, 'E', { locale: ja })}
                      </div>
                    </div>

                    {/* タイムライン（24時間） */}
                    <div className="flex-1 relative h-10 bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      {/* 時間区切り線 */}
                      {[6, 12, 18].map((hour) => (
                        <div
                          key={hour}
                          className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
                          style={{ left: `${(hour / 24) * 100}%` }}
                        />
                      ))}

                      {/* 睡眠イベント（レンジ） */}
                      {dayLogs
                        .filter(log => log.log_type === 'sleep' && log.start_time && log.end_time)
                        .map((log, logIndex) => {
                          const startTime = new Date(log.start_time!);
                          const endTime = new Date(log.end_time!);
                          
                          // 同日チェック
                          if (startTime.toDateString() !== day.toDateString()) return null;
                          
                          const startHour = startTime.getHours();
                          const startMinute = startTime.getMinutes();
                          const endHour = endTime.getHours();
                          const endMinute = endTime.getMinutes();
                          
                          const startPosition = ((startHour * 60 + startMinute) / (24 * 60)) * 100;
                          let endPosition = ((endHour * 60 + endMinute) / (24 * 60)) * 100;
                          
                          // 日をまたぐ場合は23:59まで
                          if (endTime.toDateString() !== day.toDateString()) {
                            endPosition = 100;
                          }
                          
                          const width = endPosition - startPosition;

                          return (
                            <div
                              key={`sleep-${logIndex}`}
                              className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 rounded opacity-80 hover:opacity-100 transition-opacity"
                              style={{ 
                                left: `${startPosition}%`, 
                                width: `${width}%` 
                              }}
                              title={`睡眠: ${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                            />
                          );
                        })}

                      {/* その他のイベント（ポイント） */}
                      {dayLogs
                        .filter(log => log.log_type !== 'sleep')
                        .map((log, logIndex) => {
                          const logTime = new Date(log.logged_at);
                          const hour = logTime.getHours();
                          const minute = logTime.getMinutes();
                          const position = ((hour * 60 + minute) / (24 * 60)) * 100;

                          const colorMap: Record<string, string> = {
                            feeding: 'bg-pink-500 dark:bg-pink-400',
                            wake: 'bg-yellow-500 dark:bg-yellow-400',
                            hold: 'bg-red-500 dark:bg-red-400',
                            poop: 'bg-amber-500 dark:bg-amber-400',
                            pee: 'bg-blue-500 dark:bg-blue-400',
                            temperature: 'bg-orange-500 dark:bg-orange-400',
                            measurement: 'bg-green-500 dark:bg-green-400',
                            baby_food: 'bg-purple-500 dark:bg-purple-400',
                            memo: 'bg-gray-500 dark:bg-gray-400',
                          };

                          const color = colorMap[log.log_type] || 'bg-gray-500';

                          const labelMap: Record<string, string> = {
                            feeding: '授乳',
                            wake: '起床',
                            hold: '抱っこ',
                            poop: 'うんち',
                            pee: 'しっこ',
                            temperature: '体温',
                            measurement: '測定',
                            baby_food: '離乳食',
                            memo: 'メモ',
                          };

                          return (
                            <div
                              key={logIndex}
                              className={`absolute top-0 bottom-0 w-1 ${color} opacity-90 hover:opacity-100 transition-opacity hover:w-1.5`}
                              style={{ left: `${position}%` }}
                              title={`${format(logTime, 'HH:mm')} - ${labelMap[log.log_type] || log.log_type}`}
                            />
                          );
                        })}
                    </div>

                    {/* イベント数 */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {dayLogs.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 凡例 */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { type: '授乳', color: 'bg-pink-500', icon: '●' },
                  { type: '睡眠', color: 'bg-indigo-500', icon: '━' },
                  { type: 'うんち', color: 'bg-amber-500', icon: '●' },
                  { type: 'しっこ', color: 'bg-blue-500', icon: '●' },
                  { type: '体温', color: 'bg-orange-500', icon: '●' },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{item.type}</span>
                  </div>
                ))}
              </div>
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
          <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Baby className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" />
              授乳の推移
            </h2>
            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-pink-400 to-pink-500"></div>
                <span>母乳時間</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-pink-600"></div>
                <span>回数</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="relative h-52" style={{ paddingLeft: '36px', paddingBottom: '24px' }}>
              {/* Y軸ラベル */}
              <div className="absolute left-0 top-0 bottom-6 w-9 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxBreastMinutes, Math.floor(maxBreastMinutes * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              {/* グリッドと軸 */}
              <div className="absolute left-9 right-0 top-0 bottom-6">
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
              <div className="absolute left-9 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* うんちグラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Soup className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              うんちの推移
            </h2>
            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-amber-400 to-amber-500"></div>
                <span>量</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-amber-600"></div>
                <span>回数</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="relative h-52" style={{ paddingLeft: '36px', paddingBottom: '24px' }}>
              <div className="absolute left-0 top-0 bottom-6 w-9 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxPoopAmount, Math.floor(maxPoopAmount * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              <div className="absolute left-9 right-0 top-0 bottom-6">
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

              <div className="absolute left-9 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* しっこグラフ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Droplets className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              しっこ回数の推移
            </h2>
          </div>
          
          <div className="p-4">
            <div className="relative h-48" style={{ paddingLeft: '36px', paddingBottom: '24px' }}>
              <div className="absolute left-0 top-0 bottom-6 w-9 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                {[maxPeeCount, Math.floor(maxPeeCount * 0.5), 0].map((val) => (
                  <span key={val} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              <div className="absolute left-9 right-0 top-0 bottom-6">
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

              <div className="absolute left-9 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                {dailyData.map((data, index) => (
                  <div key={index} className="flex-1 text-center">
                    <span>{format(data.date, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl p-4 border border-purple-100 dark:border-purple-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              💡 インサイト
            </h2>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
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
