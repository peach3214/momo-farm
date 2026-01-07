import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import type { Event } from '../types/database';

interface EventListProps {
  selectedDate: Date | null;
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

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

export const EventList = ({
  selectedDate,
  events,
  onEditEvent,
  onDeleteEvent,
}: EventListProps) => {
  // 選択された日のイベントをフィルタ
  const dayEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.event_date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  if (!selectedDate) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          日付を選択すると予定が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {format(selectedDate, 'M月d日 (E)', { locale: ja })}の予定
        </h3>
      </div>

      <div className="p-4">
        {dayEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            この日の予定はありません
          </p>
        ) : (
          <div className="space-y-3">
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
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
                      event.category || 'other'
                    )}`}
                  >
                    {getCategoryLabel(event.category || 'other')}
                  </span>
                </div>

                {event.memo && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
