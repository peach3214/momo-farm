import { useState, useEffect, useMemo } from 'react';
import { format, subDays, eachDayOfInterval, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart3, Baby, Soup, Droplets, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Log } from '../types/database';
import { FeedingChart } from '../components/stats/FeedingChart';
import { PoopChart, PeeChart } from '../components/stats/Charts';
import { DiaperChart } from '../components/stats/DiaperChart';
import { EventTimeline } from '../components/stats/EventTimeline';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const Statistics = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [days] = useState(7);

  useEffect(() => {
    fetchLogs();
  }, [days]);

  const fetchLogs = async () => {
    try {
      const userId = await getUserId();
      const startDate = subDays(new Date(), days - 1);
      
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', startDate.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const dailyData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    return dateRange.map(date => {
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at);
        return format(logDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
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
        if (val === 'small') return sum + 3;
        if (val === 'medium') return sum + 5;
        if (val === 'large') return sum + 8;
        const num = parseInt(val);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      const peeCount = dayLogs.reduce((sum, l) => sum + (l.log_type === 'pee' ? (l.pee_count || 0) : 0), 0);
      const diaperCount = dayLogs.filter(l => l.log_type === 'diaper').length;

      return {
        date: format(date, 'yyyy-MM-dd'),
        breastMinutes: totalBreastMinutes,
        feedingCount: feedingLogs.length,
        poopAmount: totalPoopAmount,
        poopCount: poopLogs.length,
        peeCount,
        diaperCount,
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
      if (val === 'small') return sum + 3;
      if (val === 'medium') return sum + 5;
      if (val === 'large') return sum + 8;
      const num = parseInt(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const peeCount = logs.reduce((sum, l) => sum + (l.log_type === 'pee' ? (l.pee_count || 0) : 0), 0);
    const diaperCount = logs.filter(l => l.log_type === 'diaper').length;

    return {
      feedingCount,
      breastHours: totalBreastMinutes / 60,
      avgFeedingPerDay: feedingCount / 7,
      poopCount,
      avgPoopAmount: poopCount > 0 ? totalPoopAmount / poopCount : 0,
      avgPoopPerDay: poopCount / 7,
      peeCount,
      avgPeePerDay: peeCount / 7,
      diaperCount,
      avgDiaperPerDay: diaperCount / 7,
    };
  }, [logs]);

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
            統計
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              {totalStats.avgFeedingPerDay.toFixed(1)}回/日
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-xl shadow-sm p-4 border border-yellow-100 dark:border-yellow-900">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">おむつ</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalStats.diaperCount}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">回</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalStats.avgDiaperPerDay.toFixed(1)}回/日
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
              {totalStats.avgPoopPerDay.toFixed(1)}回/日
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

        {/* Rechartsグラフ */}
        <FeedingChart data={dailyData} />
        <DiaperChart data={dailyData} />
        <PoopChart data={dailyData} />
        <PeeChart data={dailyData} />
        
        {/* タイムライン */}
        <EventTimeline logs={logs} />
      </main>
    </div>
  );
};
