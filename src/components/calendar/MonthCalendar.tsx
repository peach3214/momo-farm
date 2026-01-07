import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Log, Event } from '../types/database';

interface MonthCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: Date) => void;
  selectedDate: Date | null;
  logs: Log[];
  events: Event[];
}

export const MonthCalendar = ({
  currentMonth,
  onMonthChange,
  onDateClick,
  selectedDate,
  logs,
  events,
}: MonthCalendarProps) => {
  // カレンダーの日付を生成（月曜始まり）
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // 月曜始まり
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // 前月・次月への移動
  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  // その日に記録があるかチェック
  const hasLogs = (date: Date) => {
    return logs.some((log) => {
      const logDate = new Date(log.logged_at);
      return isSameDay(logDate, date);
    });
  };

  // その日にイベントがあるかチェック
  const hasEvents = (date: Date) => {
    return events.some((event) => {
      const eventDate = new Date(event.event_date);
      return isSameDay(eventDate, date);
    });
  };

  // 曜日ラベル
  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            今日
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* カレンダー */}
      <div className="p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium ${
                index === 5 || index === 6
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasLog = hasLogs(day);
            const hasEvent = hasEvents(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateClick(day)}
                className={`
                  aspect-square p-1 rounded-lg relative transition-colors
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                  ${isSelected
                    ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300 dark:ring-blue-700'
                    : isTodayDate 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isCurrentMonth && !isTodayDate && !isSelected
                    ? 'text-gray-900 dark:text-gray-100' 
                    : ''
                  }
                `}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                
                {/* インジケーター */}
                {(hasLog || hasEvent) && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {hasLog && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                    )}
                    {hasEvent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 p-3 border-t border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
          <span className="text-gray-600 dark:text-gray-400">記録あり</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400" />
          <span className="text-gray-600 dark:text-gray-400">予定あり</span>
        </div>
      </div>
    </div>
  );
};
