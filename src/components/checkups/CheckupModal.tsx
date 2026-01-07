import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Checkup, CheckupInsert, CheckupTask } from '../types/database';

interface CheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CheckupInsert, 'user_id'>) => Promise<void>;
  initialData?: Checkup;
}

const checkupTypes = [
  { value: 'newborn_visit', label: '新生児訪問' },
  { value: '1month', label: '1ヶ月検診' },
  { value: '3month', label: '3ヶ月検診' },
  { value: '6month', label: '6ヶ月検診' },
  { value: '9month', label: '9ヶ月検診' },
  { value: '12month', label: '12ヶ月検診' },
  { value: '18month', label: '18ヶ月検診' },
  { value: '36month', label: '3歳児検診' },
  { value: 'custom', label: 'その他' },
] as const;

export const CheckupModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CheckupModalProps) => {
  const [loading, setLoading] = useState(false);
  
  // 基本情報
  const [checkupDate, setCheckupDate] = useState('');
  const [checkupType, setCheckupType] = useState('1month');
  const [customTypeName, setCustomTypeName] = useState('');

  // 身体測定（アコーディオン）
  const [measurementOpen, setMeasurementOpen] = useState(true);
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightG, setWeightG] = useState<number | ''>('');
  const [headCircumference, setHeadCircumference] = useState<number | ''>('');
  const [chestCircumference, setChestCircumference] = useState<number | ''>('');

  // 医師コメント（アコーディオン）
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [doctorComments, setDoctorComments] = useState('');

  // タスク（アコーディオン）
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasks, setTasks] = useState<CheckupTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // その他（アコーディオン）
  const [otherOpen, setOtherOpen] = useState(false);
  const [nextTimeNotes, setNextTimeNotes] = useState('');
  const [summary, setSummary] = useState('');

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      setCheckupDate(initialData.checkup_date);
      setCheckupType(initialData.checkup_type);
      setCustomTypeName(initialData.custom_type_name || '');
      setHeightCm(initialData.height_cm || '');
      setWeightG(initialData.weight_g || '');
      setHeadCircumference(initialData.head_circumference_cm || '');
      setChestCircumference(initialData.chest_circumference_cm || '');
      setDoctorComments(initialData.doctor_comments || '');
      setTasks(initialData.tasks || []);
      setNextTimeNotes(initialData.next_time_notes || '');
      setSummary(initialData.summary || '');
    } else {
      // 新規作成時はリセット
      setCheckupDate(new Date().toISOString().split('T')[0]);
      setCheckupType('1month');
      setCustomTypeName('');
      setHeightCm('');
      setWeightG('');
      setHeadCircumference('');
      setChestCircumference('');
      setDoctorComments('');
      setTasks([]);
      setNextTimeNotes('');
      setSummary('');
    }
  }, [initialData, isOpen]);

  // タスク追加
  const addTask = () => {
    if (newTaskText.trim()) {
      setTasks([...tasks, { text: newTaskText.trim(), completed: false }]);
      setNewTaskText('');
    }
  };

  // タスク削除
  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  // タスク完了切り替え
  const toggleTask = (index: number) => {
    setTasks(
      tasks.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const checkupData: Omit<CheckupInsert, 'user_id'> = {
        checkup_date: checkupDate,
        checkup_type: checkupType as any,
        custom_type_name: checkupType === 'custom' ? customTypeName : undefined,
        height_cm: heightCm !== '' ? Number(heightCm) : undefined,
        weight_g: weightG !== '' ? Number(weightG) : undefined,
        head_circumference_cm: headCircumference !== '' ? Number(headCircumference) : undefined,
        chest_circumference_cm: chestCircumference !== '' ? Number(chestCircumference) : undefined,
        doctor_comments: doctorComments || undefined,
        tasks: tasks.length > 0 ? tasks : undefined,
        next_time_notes: nextTimeNotes || undefined,
        summary: summary || undefined,
      };

      await onSubmit(checkupData);
      onClose();
    } catch (error) {
      console.error('検診保存エラー:', error);
      alert('検診の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {initialData ? '検診記録編集' : '新しい検診記録'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                検診日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                検診種類 <span className="text-red-500">*</span>
              </label>
              <select
                value={checkupType}
                onChange={(e) => setCheckupType(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {checkupTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {checkupType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  検診名
                </label>
                <input
                  type="text"
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="例: 5ヶ月検診"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            )}
          </div>

          {/* 身体測定（アコーディオン） */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMeasurementOpen(!measurementOpen)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">身体測定</span>
              {measurementOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {measurementOpen && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      身長（cm）
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                      step="0.1"
                      placeholder="50.5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      体重（g）
                    </label>
                    <input
                      type="number"
                      value={weightG}
                      onChange={(e) => setWeightG(e.target.value ? Number(e.target.value) : '')}
                      step="10"
                      placeholder="3500"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      頭囲（cm）
                    </label>
                    <input
                      type="number"
                      value={headCircumference}
                      onChange={(e) => setHeadCircumference(e.target.value ? Number(e.target.value) : '')}
                      step="0.1"
                      placeholder="35.0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      胸囲（cm）
                    </label>
                    <input
                      type="number"
                      value={chestCircumference}
                      onChange={(e) => setChestCircumference(e.target.value ? Number(e.target.value) : '')}
                      step="0.1"
                      placeholder="33.0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 医師コメント（アコーディオン） */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setCommentsOpen(!commentsOpen)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">医師コメント</span>
              {commentsOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {commentsOpen && (
              <div className="p-4">
                <textarea
                  value={doctorComments}
                  onChange={(e) => setDoctorComments(e.target.value)}
                  rows={4}
                  placeholder="医師からのアドバイスやコメント"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                />
              </div>
            )}
          </div>

          {/* タスク（アコーディオン） */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setTasksOpen(!tasksOpen)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                タスク・チェックリスト
              </span>
              {tasksOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {tasksOpen && (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                    placeholder="新しいタスクを入力"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={addTask}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    追加
                  </button>
                </div>
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(index)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`flex-1 ${
                            task.completed
                              ? 'line-through text-gray-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {task.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* その他（アコーディオン） */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOtherOpen(!otherOpen)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">その他</span>
              {otherOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {otherOpen && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    次回までのメモ
                  </label>
                  <textarea
                    value={nextTimeNotes}
                    onChange={(e) => setNextTimeNotes(e.target.value)}
                    rows={3}
                    placeholder="次の検診までに準備することなど"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    まとめ
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    placeholder="検診の総括や気になったことなど"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
