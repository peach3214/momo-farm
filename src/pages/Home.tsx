import { useState } from 'react';
import {
  Baby,
  Moon,
  Sun,
  Heart,
  Droplet,
  Droplets,
  Utensils,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useLogs } from '../hooks/useLogs';
import { QuickActionButton } from '../components/logs/QuickActionButton';
import { TimelineItem } from '../components/logs/TimelineItem';
import { LogEntryModal } from '../components/logs/LogEntryModal';
import type { LogType, LogInsert } from '../types/database';

const quickActions = [
  { icon: Baby, label: '授乳', type: 'feeding' as LogType, color: 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:hover:bg-pink-800' },
  { icon: Moon, label: '寝る', type: 'sleep' as LogType, color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800' },
  { icon: Sun, label: '起きる', type: 'wake' as LogType, color: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800' },
  { icon: Heart, label: '抱っこ', type: 'hold' as LogType, color: 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800' },
  { icon: Droplet, label: 'うんち', type: 'poop' as LogType, color: 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800' },
  { icon: Droplets, label: 'しっこ', type: 'pee' as LogType, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800' },
  { icon: Utensils, label: '離乳食', type: 'baby_food' as LogType, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800' },
  { icon: FileText, label: 'メモ', type: 'memo' as LogType, color: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700' },
];

export const Home = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState<LogType>('feeding');
  const [editingLog, setEditingLog] = useState<string | null>(null);

  const { logs, loading, addLog, updateLog, deleteLog, refetch } = useLogs({
    date: selectedDate,
    enableRealtime: true,
  });

  const handleQuickAction = (logType: LogType) => {
    setSelectedLogType(logType);
    setEditingLog(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Omit<LogInsert, 'user_id'>) => {
    if (editingLog) {
      await updateLog(editingLog, data);
    } else {
      await addLog(data);
    }
    setModalOpen(false);
    setEditingLog(null);
  };

  const handleEdit = (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (log) {
      setSelectedLogType(log.log_type);
      setEditingLog(logId);
      setModalOpen(true);
    }
  };

  const handleDelete = async (logId: string) => {
    if (window.confirm('この記録を削除しますか？')) {
      await deleteLog(logId);
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-[200px]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            育児記録
          </h1>
        </div>
      </header>

      {/* 日付選択 */}
      <div className="sticky top-[72px] z-30 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {format(selectedDate, 'M月d日 (E)', { locale: ja })}
            </h2>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                今日
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            disabled={isToday}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* タイムライン */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              まだ記録がありません
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              下のボタンから記録を追加しましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <TimelineItem
                key={log.id}
                log={log}
                onEdit={() => handleEdit(log.id)}
                onDelete={() => handleDelete(log.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* クイックアクションボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg pb-safe-bottom">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickActionButton
                key={action.type}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onClick={() => handleQuickAction(action.type)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 記録入力モーダル */}
      <LogEntryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLog(null);
        }}
        logType={selectedLogType}
        onSubmit={handleSubmit}
        initialData={
          editingLog ? logs.find((l) => l.id === editingLog) : undefined
        }
      />
    </div>
  );
};
