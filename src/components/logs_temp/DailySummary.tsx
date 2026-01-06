import { Baby, Droplet, Droplets } from 'lucide-react';

interface DailySummaryProps {
  feeding: number;
  poop: number;
  pee: number;
}

export const DailySummary = ({ feeding, poop, pee }: DailySummaryProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        今日の記録
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {/* 授乳 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">授乳</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {feeding}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">回</span>
        </div>

        {/* うんち */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">うんち</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {poop}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">回</span>
        </div>

        {/* しっこ */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">しっこ</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {pee}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">回</span>
        </div>
      </div>
    </div>
  );
};
