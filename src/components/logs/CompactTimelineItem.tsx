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
  FileText,
  Bath
} from 'lucide-react';
import type { Log } from '../../types/database';
import { formatFeedingDuration, formatBottleAmount } from '../../utils/formatters';

interface CompactTimelineItemProps {
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
    diaper: Baby,
    bath: Bath,
    temperature: Thermometer,
    measurement: Ruler,
    baby_food: Utensils,
    memo: FileText,
  };
  return iconMap[logType] || FileText;
};

const getLogColor = (logType: Log['log_type']) => {
  const colorMap = {
    feeding: 'from-pink-500 to-pink-600',
    sleep: 'from-indigo-500 to-indigo-600',
    wake: 'from-yellow-500 to-yellow-600',
    hold: 'from-red-500 to-red-600',
    poop: 'from-amber-500 to-amber-600',
    pee: 'from-blue-500 to-blue-600',
    diaper: 'from-yellow-500 to-amber-500',
    bath: 'from-cyan-500 to-cyan-600',
    temperature: 'from-orange-500 to-orange-600',
    measurement: 'from-green-500 to-green-600',
    baby_food: 'from-purple-500 to-purple-600',
    memo: 'from-gray-500 to-gray-600',
  };
  return colorMap[logType] || colorMap.memo;
};

const getLineColor = (logType: Log['log_type']) => {
  const colorMap = {
    feeding: 'bg-pink-300 dark:bg-pink-700',
    sleep: 'bg-indigo-300 dark:bg-indigo-700',
    wake: 'bg-yellow-300 dark:bg-yellow-700',
    hold: 'bg-red-300 dark:bg-red-700',
    poop: 'bg-amber-300 dark:bg-amber-700',
    pee: 'bg-blue-300 dark:bg-blue-700',
    diaper: 'bg-yellow-300 dark:bg-yellow-700',
    bath: 'bg-cyan-300 dark:bg-cyan-700',
    temperature: 'bg-orange-300 dark:bg-orange-700',
    measurement: 'bg-green-300 dark:bg-green-700',
    baby_food: 'bg-purple-300 dark:bg-purple-700',
    memo: 'bg-gray-300 dark:bg-gray-700',
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
    diaper: 'おむつ',
    bath: 'お風呂',
    temperature: '体温',
    measurement: '身長体重',
    baby_food: '離乳食',
    memo: 'メモ',
  };
  return labelMap[logType] || 'メモ';
};

export const CompactTimelineItem = ({ log, onEdit, onDelete }: CompactTimelineItemProps) => {
  const Icon = getLogIcon(log.log_type);
  const iconColor = getLogColor(log.log_type);
  const lineColor = getLineColor(log.log_type);
  const label = getLogLabel(log.log_type);

  const renderContent = () => {
    switch (log.log_type) {
      case 'feeding':
        if (log.feeding_type === 'bottle') {
          return (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ミルク {formatBottleAmount(log.feeding_amount_ml)}
            </span>
          );
        }
        // 母乳の場合
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {formatFeedingDuration(
              log.feeding_duration_left_min,
              log.feeding_duration_right_min
            )}
          </span>
        );

      case 'sleep':
      case 'hold':
        if (log.start_time && log.end_time) {
          const duration = Math.floor(
            (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000
          );
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          return (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {hours > 0 ? `${hours}時間` : ''}{minutes}分
            </span>
          );
        }
        return null;

      case 'poop':
        let amountDisplay = '';
        if (log.poop_amount) {
          if (typeof log.poop_amount === 'string') {
            amountDisplay = log.poop_amount;
          } else if (typeof log.poop_amount === 'number') {
            const num = log.poop_amount;
            if (num <= 3) amountDisplay = '少量';
            else if (num >= 7) amountDisplay = '多量';
            else amountDisplay = '普通';
          }
        }
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {amountDisplay && `${amountDisplay} • `}{log.poop_color}
          </span>
        );

      case 'pee':
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {log.pee_count}回
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2 group">
      {/* アイコンのみ（縦線なし） */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {label}
          </h3>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              aria-label="編集"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              aria-label="削除"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 詳細 */}
        <div>
          {renderContent()}
        </div>

        {/* メモ */}
        {log.memo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {log.memo}
          </p>
        )}
      </div>
    </div>
  );
};
