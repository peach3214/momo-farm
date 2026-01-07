import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calendar, Edit2, Trash2 } from 'lucide-react';
import type { Log, Event } from '../types/database';
import { TimelineItem } from "../logs/TimelineItem";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  logs: Log[];
  events: Event[];
  onEditLog: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddLog: () => void;
  onAddEvent: () => void;
}

export const DayDetailModal = ({
  isOpen,
  onClose,
  selectedDate,
  logs,
  events,
  onEditLog,
  onDeleteLog,
  onEditEvent,
  onDeleteEvent,
  onAddLog,
  onAddEvent,
}: DayDetailModalProps) => {
  if (!isOpen) return null;

  // その日の記録をフィルタ
  const dayLogs = logs.filter((log) => {
    const logDate = new Date(log.logged_at);
    return logDate.toDateString() === selectedDate.toDateString();
  });

  // その日のイベントをフィルタ
  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vaccination: '予防接種',
      checkup: '検診',
      celebration: 'お祝い',
      other: 'その他',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vaccination: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
      checkup: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      celebration: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {format(selectedDate, 'M月d日 (E)', { locale: ja })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* イベント一覧 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                予定
              </h3>
              <button
                onClick={onAddEvent}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                + 追加
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                予定はありません
              </p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {event.event_name}
                        </h4>
                        {event.is_relative && event.relative_days !== null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            生後{event.relative_days}日
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditEvent(event)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('このイベントを削除しますか？')) {
                              onDeleteEvent(event.id);
                            }
                          }}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
                          event.category
                        )}`}
                      >
                        {getCategoryLabel(event.category)}
                      </span>
                    </div>

                    {event.memo && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {event.memo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 記録一覧 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                記録
              </h3>
              <button
                onClick={onAddLog}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                + 追加
              </button>
            </div>

            {dayLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                記録はありません
              </p>
            ) : (
              <div className="space-y-3">
                {dayLogs.map((log) => (
                  <TimelineItem
                    key={log.id}
                    log={log}
                    onEdit={() => onEditLog(log.id)}
                    onDelete={() => onDeleteLog(log.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
