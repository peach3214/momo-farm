import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Edit2, Trash2, ChevronRight } from 'lucide-react';
import type { Checkup } from '../types/database';

interface CheckupCardProps {
  checkup: Checkup;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const checkupTypeLabels: Record<string, string> = {
  newborn_visit: '新生児訪問',
  '1month': '1ヶ月検診',
  '3month': '3ヶ月検診',
  '6month': '6ヶ月検診',
  '9month': '9ヶ月検診',
  '12month': '12ヶ月検診',
  '18month': '18ヶ月検診',
  '36month': '3歳児検診',
  custom: 'その他',
};

export const CheckupCard = ({ checkup, onEdit, onDelete, onClick }: CheckupCardProps) => {
  const checkupLabel = checkup.checkup_type === 'custom' && checkup.custom_type_name
    ? checkup.custom_type_name
    : checkupTypeLabels[checkup.checkup_type] || '検診';

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(checkup.checkup_date), 'yyyy年M月d日 (E)', { locale: ja })}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {checkupLabel}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('この検診記録を削除しますか？')) {
                  onDelete();
                }
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 身体測定 */}
        {(checkup.height_cm || checkup.weight_g || checkup.head_circumference_cm) && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {checkup.height_cm && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">身長</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {checkup.height_cm}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">cm</span>
                </p>
              </div>
            )}
            {checkup.weight_g && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">体重</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(checkup.weight_g / 1000).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">kg</span>
                </p>
              </div>
            )}
            {checkup.head_circumference_cm && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">頭囲</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {checkup.head_circumference_cm}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">cm</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* まとめ */}
        {checkup.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {checkup.summary}
          </p>
        )}

        {/* 詳細を見るリンク */}
        <div className="flex items-center justify-end text-blue-600 dark:text-blue-400 text-sm font-medium">
          <span>詳細を見る</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </div>
  );
};
