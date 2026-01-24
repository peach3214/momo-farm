import { useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Log } from '../../types/database';

interface EventTimelineProps {
  logs: Log[];
}

const logTypeConfig = {
  feeding: { color: '#ec4899', label: '授乳' },
  sleep: { color: '#6366f1', label: '睡眠' },
  diaper: { color: '#eab308', label: 'おむつ' },
  poop: { color: '#f59e0b', label: 'うんち' },
  pee: { color: '#3b82f6', label: 'しっこ' },
  bath: { color: '#06b6d4', label: 'お風呂' },
  baby_food: { color: '#f97316', label: '離乳食' },
};

export const EventTimeline = ({ logs }: EventTimelineProps) => {
  // 過去7日分の日付とログをグループ化
  const timelineData = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayLogs = logs.filter(log => {
        const logDate = format(new Date(log.logged_at), 'yyyy-MM-dd');
        return logDate === dateStr;
      });
      
      result.push({
        date: dateStr,
        logs: dayLogs,
      });
    }
    
    return result;
  }, [logs]);

  const renderEventBars = (dayLogs: Log[]) => {
    return dayLogs.map((log, idx) => {
      const config = logTypeConfig[log.log_type as keyof typeof logTypeConfig];
      if (!config) return null;

      const logTime = new Date(log.logged_at);
      const hours = logTime.getHours();
      const minutes = logTime.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const percentage = (totalMinutes / (24 * 60)) * 100;

      // 睡眠とお風呂は範囲バー
      if ((log.log_type === 'sleep' || log.log_type === 'bath') && log.start_time && log.end_time) {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        const startPercent = (startMinutes / (24 * 60)) * 100;
        const endPercent = (endMinutes / (24 * 60)) * 100;
        const height = endPercent - startPercent;

        return (
          <div
            key={idx}
            className="absolute left-0 right-0 rounded-sm opacity-80 hover:opacity-100 transition-opacity group"
            style={{
              top: `${startPercent}%`,
              height: `${height}%`,
              backgroundColor: config.color,
            }}
            title={`${config.label} ${format(start, 'HH:mm')}〜${format(end, 'HH:mm')}`}
          >
            <div className="absolute left-full ml-1 top-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-1.5 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {format(start, 'HH:mm')}
            </div>
          </div>
        );
      }

      // その他はドット
      return (
        <div
          key={idx}
          className="absolute left-0 right-0 h-1.5 rounded-full opacity-80 hover:opacity-100 transition-opacity group"
          style={{
            top: `${percentage}%`,
            backgroundColor: config.color,
          }}
          title={`${config.label} ${format(logTime, 'HH:mm')}`}
        >
          <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-1.5 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {format(logTime, 'HH:mm')}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">週間タイムライン</h2>
      </div>

      <div className="p-4">
        {/* タイムライン */}
        <div className="flex gap-2">
          {/* 時刻軸 */}
          <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2 h-96">
            {[0, 6, 12, 18, 24].map(hour => (
              <div key={hour} className="text-right" style={{ marginTop: hour === 0 ? 0 : -8 }}>
                {hour}
              </div>
            ))}
          </div>

          {/* 日付カラム */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {timelineData.map(({ date, logs: dayLogs }) => (
              <div key={date} className="flex flex-col">
                {/* 日付ヘッダー */}
                <div className="text-center mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {format(new Date(date), 'd')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(date), 'E', { locale: ja })}
                  </div>
                </div>

                {/* タイムラインバー */}
                <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 rounded-lg h-96">
                  {/* 背景グリッド */}
                  {[0, 25, 50, 75, 100].map(percent => (
                    <div
                      key={percent}
                      className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                      style={{ top: `${percent}%` }}
                    />
                  ))}

                  {/* イベントバー */}
                  <div className="absolute inset-0 px-0.5">
                    {renderEventBars(dayLogs)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {Object.entries(logTypeConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
