import { useState, useEffect, useMemo } from 'react';
import { useLogs } from '../hooks/useLogs';
import { LogEntryModal } from '../components/logs/LogEntryModal';
import { QuickActions } from '../components/home/QuickActions';
import { QuickTimer } from '../components/home/QuickTimer';
import { VoiceInput, parseVoiceCommand } from '../components/home/VoiceInput';
import { useCustomNotifications, useNursingReminder } from '../hooks/useNotifications';
import { format, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Baby, Moon, Coffee, Droplets, Bath, UtensilsCrossed, Edit2, Trash2 } from 'lucide-react';
import type { LogType, LogInsert } from '../types/database';

const logTypeConfig = {
  feeding: { icon: Baby, color: 'bg-pink-500', label: '授乳' },
  sleep: { icon: Moon, color: 'bg-indigo-500', label: '睡眠' },
  wake: { icon: Moon, color: 'bg-yellow-500', label: '起床' },
  poop: { icon: Coffee, color: 'bg-amber-500', label: 'うんち' },
  pee: { icon: Droplets, color: 'bg-blue-500', label: 'しっこ' },
  bath: { icon: Bath, color: 'bg-cyan-500', label: 'お風呂' },
  baby_food: { icon: UtensilsCrossed, color: 'bg-orange-500', label: '離乳食' },
  memo: { icon: Coffee, color: 'bg-gray-500', label: 'メモ' },
  hold: { icon: Baby, color: 'bg-purple-500', label: '抱っこ' },
  temperature: { icon: Coffee, color: 'bg-red-500', label: '体温' },
  measurement: { icon: Coffee, color: 'bg-green-500', label: '身長体重' },
};

export const Home = () => {
  const { logs, loading, addLog, updateLog, deleteLog } = useLogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState<LogType>('feeding');
  const [editingLog, setEditingLog] = useState<any>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerLogType, setTimerLogType] = useState<LogType>('feeding');
  
  const { notify } = useCustomNotifications();

  // 最後の授乳時刻を取得
  const lastFeedingTime = useMemo(() => {
    const feedingLogs = logs.filter(l => l.log_type === 'feeding');
    if (feedingLogs.length === 0) return null;
    return new Date(feedingLogs[feedingLogs.length - 1].logged_at);
  }, [logs]);

  // 授乳リマインダー（3時間ごと）
  useNursingReminder(lastFeedingTime, 3);

  const handleQuickAction = (type: LogType) => {
    // タイマーが必要なアクション
    if (type === 'feeding' || type === 'sleep' || type === 'bath') {
      setTimerLogType(type);
      setIsTimerOpen(true);
    } else {
      setSelectedLogType(type);
      setEditingLog(null);
      setIsModalOpen(true);
    }
  };

  const handleTimerSave = async (durationSeconds: number) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - durationSeconds * 1000);

    let logData: Omit<LogInsert, 'user_id'>;

    if (timerLogType === 'feeding') {
      const minutes = Math.floor(durationSeconds / 60);
      logData = {
        log_type: 'feeding',
        logged_at: startTime.toISOString(),
        feeding_type: 'breast',
        feeding_duration_left_min: Math.floor(minutes / 2),
        feeding_duration_right_min: Math.ceil(minutes / 2),
      };
    } else if (timerLogType === 'sleep') {
      logData = {
        log_type: 'sleep',
        logged_at: startTime.toISOString(),
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
      };
    } else if (timerLogType === 'bath') {
      logData = {
        log_type: 'bath',
        logged_at: startTime.toISOString(),
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
      };
    } else {
      return;
    }

    await addLog(logData);
    notify('記録完了', `${logTypeConfig[timerLogType].label}を記録しました`);
  };

  const handleVoiceResult = (text: string) => {
    const command = parseVoiceCommand(text);
    
    if (command) {
      notify('音声認識', `「${text}」を認識しました`);
      
      if (command.type === 'feeding' && command.duration) {
        // 授乳（時間指定あり）
        addLog({
          log_type: 'feeding',
          logged_at: new Date().toISOString(),
          feeding_type: 'breast',
          feeding_duration_left_min: Math.floor(command.duration / 2),
          feeding_duration_right_min: Math.ceil(command.duration / 2),
        });
      } else if (command.type === 'pee' && command.amount) {
        // しっこ（回数指定あり）
        addLog({
          log_type: 'pee',
          logged_at: new Date().toISOString(),
          pee_count: command.amount,
        });
      } else {
        // その他
        handleQuickAction(command.type as LogType);
      }
    } else {
      notify('音声認識', '認識できませんでした');
    }
  };

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setSelectedLogType(log.log_type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      await deleteLog(id);
    }
  };

  const todayLogs = useMemo(() => {
    const today = startOfDay(new Date());
    return logs
      .filter(log => {
        const logDate = startOfDay(new Date(log.logged_at));
        return logDate.getTime() === today.getTime();
      })
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  }, [logs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            育児記録
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {format(new Date(), 'M月d日（E）', { locale: ja })}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* クイックアクション */}
        <QuickActions onAction={handleQuickAction} />

        {/* 今日の記録 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              今日の記録 ({todayLogs.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {todayLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                まだ記録がありません
              </div>
            ) : (
              todayLogs.map(log => {
                const config = logTypeConfig[log.log_type as keyof typeof logTypeConfig];
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${config.color} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {config.label}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(log.logged_at), 'HH:mm')}
                          </span>
                        </div>

                        {log.memo && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {log.memo}
                          </p>
                        )}

                        {/* アクションボタン */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(log)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* 音声入力ボタン */}
      <div className="fixed bottom-24 right-4 z-40">
        <VoiceInput onResult={handleVoiceResult} />
      </div>

      {/* モーダル */}
      <LogEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLog(null);
        }}
        logType={selectedLogType}
        onSubmit={async (data) => {
          if (editingLog) {
            await updateLog(editingLog.id, data);
          } else {
            await addLog(data);
          }
          setIsModalOpen(false);
          setEditingLog(null);
        }}
        initialData={editingLog}
      />

      {/* タイマー */}
      <QuickTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        onSave={handleTimerSave}
        title={logTypeConfig[timerLogType].label}
        color={logTypeConfig[timerLogType].color.replace('bg-', 'from-') + ' to-' + logTypeConfig[timerLogType].color.replace('bg-', '').replace('-500', '-600')}
      />
    </div>
  );
};
