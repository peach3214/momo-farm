import { useState } from 'react';
import { X } from 'lucide-react';
import type { LogType, LogInsert } from '../types/database';

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logType: LogType;
  onSubmit: (data: Omit<LogInsert, 'user_id'>) => Promise<void>;
  initialData?: Partial<LogInsert>;
}

const logTypeLabels: Record<LogType, string> = {
  feeding: '授乳',
  sleep: '寝る',
  wake: '起きる',
  hold: '抱っこ',
  poop: 'うんち',
  pee: 'しっこ',
  temperature: '体温',
  measurement: '身長体重',
  baby_food: '離乳食',
  memo: 'メモ',
};

// UTCからJSTの文字列に変換（datetime-local用）
const toJSTString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// datetime-localの値（JST）からUTC Dateオブジェクトを作成
const fromJSTString = (jstString: string): Date => {
  // datetime-local の値はローカルタイムゾーンとして解釈される
  return new Date(jstString);
};

export const LogEntryModal = ({
  isOpen,
  onClose,
  logType,
  onSubmit,
  initialData,
}: LogEntryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [loggedAt, setLoggedAt] = useState(
    initialData?.logged_at 
      ? toJSTString(new Date(initialData.logged_at))
      : toJSTString(new Date())
  );
  const [memo, setMemo] = useState(initialData?.memo || '');

  // 授乳
  const [feedingType, setFeedingType] = useState<'breast' | 'bottle'>(
    initialData?.feeding_type === 'bottle' ? 'bottle' : 'breast'
  );
  const [leftMin, setLeftMin] = useState(
    initialData?.feeding_duration_left_min || 0
  );
  const [rightMin, setRightMin] = useState(
    initialData?.feeding_duration_right_min || 0
  );
  const [bottleAmount, setBottleAmount] = useState(
    initialData?.feeding_amount_ml || 0
  );

  // 睡眠・抱っこ
  const [startTime, setStartTime] = useState(
    initialData?.start_time
      ? toJSTString(new Date(initialData.start_time))
      : toJSTString(new Date())
  );
  const [endTime, setEndTime] = useState(
    initialData?.end_time
      ? toJSTString(new Date(initialData.end_time))
      : toJSTString(new Date())
  );

  // うんち
  const [poopAmount, setPoopAmount] = useState(
    initialData?.poop_amount || 'medium'
  );
  const [poopColor, setPoopColor] = useState(initialData?.poop_color || '黄色');
  const [poopConsistency, setPoopConsistency] = useState(
    initialData?.poop_consistency || 'normal'
  );

  // しっこ
  const [peeCount, setPeeCount] = useState(initialData?.pee_count || 1);

  // 体温
  const [temperature, setTemperature] = useState(
    initialData?.temperature_celsius || 36.5
  );
  const [temperatureLocation, setTemperatureLocation] = useState(
    initialData?.temperature_location || 'armpit'
  );

  // 身長体重
  const [heightCm, setHeightCm] = useState(initialData?.height_cm || 0);
  const [weightG, setWeightG] = useState(initialData?.weight_g || 0);
  const [headCircumference, setHeadCircumference] = useState(
    initialData?.head_circumference_cm || 0
  );

  // 離乳食
  const [babyFoodContent, setBabyFoodContent] = useState(
    initialData?.baby_food_content || ''
  );
  const [babyFoodAmount, setBabyFoodAmount] = useState(
    initialData?.baby_food_amount || 'all'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseData = {
        log_type: logType,
        logged_at: fromJSTString(loggedAt).toISOString(),
        memo: memo || undefined,
      };

      let specificData = {};

      switch (logType) {
        case 'feeding':
          if (feedingType === 'bottle') {
            specificData = {
              feeding_type: 'bottle' as const,
              feeding_amount_ml: bottleAmount,
            };
          } else {
            specificData = {
              feeding_type: 'both' as const,
              feeding_duration_left_min: leftMin > 0 ? leftMin : undefined,
              feeding_duration_right_min: rightMin > 0 ? rightMin : undefined,
            };
          }
          break;

        case 'sleep':
        case 'hold':
          specificData = {
            start_time: fromJSTString(startTime).toISOString(),
            end_time: endTime ? fromJSTString(endTime).toISOString() : undefined,
          };
          break;

        case 'poop':
          specificData = {
            poop_amount: poopAmount as any,
            poop_color: poopColor,
            poop_consistency: poopConsistency as any,
          };
          break;

        case 'pee':
          specificData = {
            pee_count: peeCount,
          };
          break;

        case 'temperature':
          specificData = {
            temperature_celsius: temperature,
            temperature_location: temperatureLocation as any,
          };
          break;

        case 'measurement':
          specificData = {
            height_cm: heightCm > 0 ? heightCm : undefined,
            weight_g: weightG > 0 ? weightG : undefined,
            head_circumference_cm:
              headCircumference > 0 ? headCircumference : undefined,
          };
          break;

        case 'baby_food':
          specificData = {
            baby_food_content: babyFoodContent,
            baby_food_amount: babyFoodAmount as any,
          };
          break;
      }

      await onSubmit({ ...baseData, ...specificData } as any);
      onClose();
    } catch (error) {
      console.error('記録保存エラー:', error);
      alert('記録の保存に失敗しました');
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
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {logTypeLabels[logType]}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日時
            </label>
            <input
              type="datetime-local"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          {/* 記録タイプ別フォーム */}
          {logType === 'feeding' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeedingType('breast')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    feedingType === 'breast'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  母乳
                </button>
                <button
                  type="button"
                  onClick={() => setFeedingType('bottle')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    feedingType === 'bottle'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ミルク
                </button>
              </div>

              {feedingType === 'breast' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      左（分）
                    </label>
                    <input
                      type="number"
                      value={leftMin}
                      onChange={(e) => setLeftMin(Number(e.target.value))}
                      min="0"
                      max="180"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      右（分）
                    </label>
                    <input
                      type="number"
                      value={rightMin}
                      onChange={(e) => setRightMin(Number(e.target.value))}
                      min="0"
                      max="180"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    量（ml）
                  </label>
                  <input
                    type="number"
                    value={bottleAmount}
                    onChange={(e) => setBottleAmount(Number(e.target.value))}
                    min="0"
                    max="500"
                    step="10"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          )}

          {(logType === 'sleep' || logType === 'hold') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  開始時刻
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  終了時刻（任意）
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {logType === 'poop' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  量
                </label>
                <select
                  value={poopAmount}
                  onChange={(e) => setPoopAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="small">少量</option>
                  <option value="medium">普通</option>
                  <option value="large">多量</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  色
                </label>
                <input
                  type="text"
                  value={poopColor}
                  onChange={(e) => setPoopColor(e.target.value)}
                  placeholder="黄色、緑、茶色など"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  形状
                </label>
                <select
                  value={poopConsistency}
                  onChange={(e) => setPoopConsistency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="watery">水様</option>
                  <option value="soft">軟便</option>
                  <option value="normal">普通</option>
                  <option value="hard">硬い</option>
                </select>
              </div>
            </div>
          )}

          {logType === 'pee' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                回数
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPeeCount(Math.max(1, peeCount - 1))}
                  className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 w-16 text-center">
                  {peeCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPeeCount(peeCount + 1)}
                  className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {logType === 'temperature' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  体温（℃）
                </label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min="30"
                  max="45"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  測定場所
                </label>
                <select
                  value={temperatureLocation}
                  onChange={(e) => setTemperatureLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="armpit">脇下</option>
                  <option value="oral">口腔</option>
                  <option value="forehead">額</option>
                  <option value="ear">耳</option>
                </select>
              </div>
            </div>
          )}

          {logType === 'measurement' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  身長（cm）
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  min="0"
                  max="200"
                  step="0.1"
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
                  onChange={(e) => setWeightG(Number(e.target.value))}
                  min="0"
                  max="50000"
                  step="10"
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
                  onChange={(e) => setHeadCircumference(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {logType === 'baby_food' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容
                </label>
                <input
                  type="text"
                  value={babyFoodContent}
                  onChange={(e) => setBabyFoodContent(e.target.value)}
                  placeholder="おかゆ、野菜ペーストなど"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  量
                </label>
                <select
                  value={babyFoodAmount}
                  onChange={(e) => setBabyFoodAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">完食</option>
                  <option value="half">半分</option>
                  <option value="little">少し</option>
                  <option value="none">食べず</option>
                </select>
              </div>
            </div>
          )}

          {/* メモ（全タイプ共通） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="特記事項があれば記入してください"
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
