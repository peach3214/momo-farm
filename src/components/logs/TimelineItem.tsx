import { 
  Baby, 
  Moon, 
  Sun, 
  Heart, 
  Soup, 
  Droplets,
  Thermometer, 
  Ruler, 
  Utensils,
  FileText 
} from 'lucide-react';
import type { Log } from '../../types/database';
import { formatTime, formatFeedingDuration, formatBottleAmount } from '../../utils/formatters';

interface TimelineItemProps {
  log: Log;
  onEdit: () => void;
  onDelete: () => void;
}

const getLogIcon = (logType: Log['log_type']) => {
  const iconMap = {
    feeding: Baby,
    sleep: Moon,
    wake: Sun,
    hold: Heart,
    poop: Soup,
    pee: Droplets,
    temperature: Thermometer,
    measurement: Ruler,
    baby_food: Utensils,
    memo: FileText,
  };
  return iconMap[logType] || FileText;
};

const getLogColor = (logType: Log['log_type']) => {
  const colorMap = {
    feeding: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    sleep: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    wake: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    hold: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    poop: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    pee: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    temperature: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    measurement: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    baby_food: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    memo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return colorMap[logType] || colorMap.memo;
};

const getLogLabel = (logType: Log['log_type']) => {
  const labelMap = {
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
  return labelMap[logType] || 'メモ';
};

export const TimelineItem = ({ log, onEdit, onDelete }: TimelineItemProps) => {
  const Icon = getLogIcon(log.log_type);
  const color = getLogColor(log.log_type);
  const label = getLogLabel(log.log_type);

  const renderContent = () => {
    switch (log.log_type) {
      case 'feeding':
        if (log.feeding_type === 'bottle') {
          return (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ミルク {formatBottleAmount(log.feeding_amount_ml || 0)}
            </p>
          );
        } else {
          const leftDuration = formatFeedingDuration(log.feeding_duration_left_min || 0);
          const rightDuration = formatFeedingDuration(log.feeding_duration_right_min || 0);
          return (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {leftDuration && `左 ${leftDuration}`}
              {leftDuration && rightDuration && ' / '}
              {rightDuration && `右 ${rightDuration}`}
            </p>
          );
        }

      case 'sleep':
      case 'hold':
        if (log.end_time) {
          const start = new Date(log.start_time!);
          const end = new Date(log.end_time);
          const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
          return (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {formatTime(log.start_time!)} 〜 {formatTime(log.end_time)}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({duration}分)
              </span>
            </p>
          );
        }
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatTime(log.start_time!)} 〜
          </p>
        );

      case 'poop':
        // 1-10段階の数値または古い形式の文字列に対応
        let amountDisplay = '普通';
        if (log.poop_amount) {
          const val = String(log.poop_amount);
          if (val === 'small') amountDisplay = '少量';
          else if (val === 'large') amountDisplay = '多量';
          else if (val === 'medium') amountDisplay = '普通';
          else {
            const num = parseInt(val);
            if (!isNaN(num)) amountDisplay = `量: ${num}`;
          }
        }
        const consistency = log.poop_consistency === 'watery' ? '水様' : 
                          log.poop_consistency === 'soft' ? '軟便' :
                          log.poop_consistency === 'hard' ? '硬い' : '普通';
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {amountDisplay} / {log.poop_color} / {consistency}
          </p>
        );

      case 'pee':
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {log.pee_count}回
          </p>
        );

      case 'temperature':
        const location = log.temperature_location === 'armpit' ? '脇下' :
                        log.temperature_location === 'oral' ? '口腔' :
                        log.temperature_location === 'forehead' ? '額' : '耳';
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {log.temperature_celsius}℃ ({location})
          </p>
        );

      case 'measurement':
        return (
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {log.height_cm && <p>身長: {log.height_cm}cm</p>}
            {log.weight_g && <p>体重: {(log.weight_g / 1000).toFixed(2)}kg</p>}
            {log.head_circumference_cm && <p>頭囲: {log.head_circumference_cm}cm</p>}
          </div>
        );

      case 'baby_food':
        const foodAmount = log.baby_food_amount === 'all' ? '完食' :
                          log.baby_food_amount === 'half' ? '半分' :
                          log.baby_food_amount === 'little' ? '少し' : '食べず';
        return (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {log.baby_food_content} ({foodAmount})
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(log.logged_at)}
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 詳細 */}
          {renderContent()}

          {/* メモ */}
          {log.memo && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              {log.memo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
