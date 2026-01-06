import { 
  Baby, 
  Moon, 
  Sun, 
  Heart, 
  Droplet, 
  Droplets,
  Thermometer, 
  Ruler, 
  Utensils,
  FileText 
} from 'lucide-react';
import type { Log } from '../types/database';
import { formatTime, formatFeedingDuration, formatBottleAmount } from "../../utils/formatters";

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
    poop: Droplet,
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

const getLogContent = (log: Log): string => {
  switch (log.log_type) {
    case 'feeding':
      if (log.feeding_type === 'bottle') {
        return `ミルク ${formatBottleAmount(log.feeding_amount_ml || 0)}`;
      }
      return `母乳 ${formatFeedingDuration(
        log.feeding_duration_left_min,
        log.feeding_duration_right_min
      )}`;
    
    case 'sleep':
    case 'hold':
      if (log.end_time) {
        const duration = Math.round(
          (new Date(log.end_time).getTime() - new Date(log.start_time!).getTime()) / 60000
        );
        return `${duration}分`;
      }
      return '記録中';
    
    case 'poop':
      const parts = [];
      if (log.poop_amount) parts.push(log.poop_amount);
      if (log.poop_consistency) parts.push(log.poop_consistency);
      return parts.join(' / ');
    
    case 'pee':
      return `${log.pee_count}回`;
    
    case 'temperature':
      return `${log.temperature_celsius}℃`;
    
    case 'measurement':
      const measurements = [];
      if (log.height_cm) measurements.push(`${log.height_cm}cm`);
      if (log.weight_g) measurements.push(`${(log.weight_g / 1000).toFixed(2)}kg`);
      return measurements.join(' / ');
    
    case 'baby_food':
      return log.baby_food_content || '離乳食';
    
    case 'memo':
      return log.memo || 'メモ';
    
    default:
      return '';
  }
};

export const TimelineItem = ({ log, onEdit, onDelete }: TimelineItemProps) => {
  const Icon = getLogIcon(log.log_type);
  const colorClass = getLogColor(log.log_type);
  const content = getLogContent(log);

  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* 時刻 */}
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatTime(log.logged_at)}
        </span>
      </div>

      {/* アイコンとコンテンツ */}
      <div className="flex-1 flex items-center gap-3">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {content}
          </p>
          {log.memo && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {log.memo}
            </p>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
