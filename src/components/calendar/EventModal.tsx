import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { addDays, differenceInDays, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { EventInsert } from '../types/database';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<EventInsert, 'user_id'>) => Promise<void>;
  childBirthday: Date | null;
  initialData?: Partial<EventInsert>;
}

type DateMode = 'absolute' | 'relative';

const categories = [
  { value: 'vaccination', label: '予防接種' },
  { value: 'checkup', label: '検診' },
  { value: 'celebration', label: 'お祝い' },
  { value: 'other', label: 'その他' },
] as const;

export const EventModal = ({
  isOpen,
  onClose,
  onSubmit,
  childBirthday,
  initialData,
}: EventModalProps) => {
  const [loading, setLoading] = useState(false);
  const [dateMode, setDateMode] = useState<DateMode>('absolute');
  
  // フォームの状態
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [memo, setMemo] = useState('');
  
  // 絶対日付
  const [absoluteDate, setAbsoluteDate] = useState('');
  
  // 相対日付
  const [relativeDays, setRelativeDays] = useState<number>(0);

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      setEventName(initialData.event_name || '');
      setCategory(initialData.category || 'other');
      setMemo(initialData.memo || '');
      
      if (initialData.is_relative && initialData.relative_days !== null) {
        setDateMode('relative');
        setRelativeDays(initialData.relative_days);
      } else if (initialData.event_date) {
        setDateMode('absolute');
        setAbsoluteDate(initialData.event_date);
      }
    } else {
      // 新規作成時はリセット
      setEventName('');
      setCategory('other');
      setMemo('');
      setAbsoluteDate(new Date().toISOString().split('T')[0]);
      setRelativeDays(0);
      setDateMode('absolute');
    }
  }, [initialData, isOpen]);

  // 相対日付から絶対日付を計算（誕生日 = 0日目）
  const calculateAbsoluteDate = (days: number): Date | null => {
    if (!childBirthday) return null;
    // 誕生日を0日目として、指定された日数を加算
    return addDays(childBirthday, days);
  };

  // 計算された日付（表示用）
  const calculatedDate = dateMode === 'relative' && childBirthday
    ? calculateAbsoluteDate(relativeDays)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let eventDate: string;
      let isRelative = false;
      let relativeDaysValue: number | null = null;

      if (dateMode === 'relative') {
        if (!childBirthday) {
          alert('子供の誕生日が設定されていません');
          return;
        }
        const calculated = calculateAbsoluteDate(relativeDays);
        if (!calculated) {
          alert('日付の計算に失敗しました');
          return;
        }
        eventDate = format(calculated, 'yyyy-MM-dd');
        isRelative = true;
        relativeDaysValue = relativeDays;
      } else {
        eventDate = absoluteDate;
        isRelative = false;
        relativeDaysValue = null;
      }

      const eventData: Omit<EventInsert, 'user_id'> = {
        event_name: eventName,
        event_date: eventDate,
        category: category as any,
        memo: memo || null,
        is_relative: isRelative,
        relative_days: relativeDaysValue,
      };

      await onSubmit(eventData);
      onClose();
    } catch (error) {
      console.error('イベント保存エラー:', error);
      alert('イベントの保存に失敗しました');
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
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto mx-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {initialData ? 'イベント編集' : '新しいイベント'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* イベント名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              イベント名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例: 1ヶ月検診"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* 日付指定方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日付指定 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setDateMode('absolute')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  dateMode === 'absolute'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                日付指定
              </button>
              <button
                type="button"
                onClick={() => setDateMode('relative')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  dateMode === 'relative'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                生後◯日
              </button>
            </div>

            {/* 絶対日付入力 */}
            {dateMode === 'absolute' && (
              <input
                type="date"
                value={absoluteDate}
                onChange={(e) => setAbsoluteDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            )}

            {/* 相対日付入力 */}
            {dateMode === 'relative' && (
              <div className="space-y-3">
                {!childBirthday && (
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ 子供の誕生日が設定されていません。設定から誕生日を登録してください。
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">生後</span>
                  <input
                    type="number"
                    value={relativeDays}
                    onChange={(e) => setRelativeDays(Number(e.target.value))}
                    min="0"
                    max="3650"
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span className="text-gray-700 dark:text-gray-300">日</span>
                </div>

                {calculatedDate && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      = {format(calculatedDate, 'yyyy年M月d日 (E)', { locale: ja })}
                    </p>
                    {childBirthday && (
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        （{format(childBirthday, 'yyyy年M月d日', { locale: ja })}生まれ）
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="詳細や注意事項など"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
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
