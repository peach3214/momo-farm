import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, X } from 'lucide-react';

interface FeedingTimerProps {
  onSave: (leftMinutes: number, rightMinutes: number) => void;
  onCancel: () => void;
}

type Side = 'left' | 'right' | null;

export const FeedingTimer = ({ onSave, onCancel }: FeedingTimerProps) => {
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [rightSeconds, setRightSeconds] = useState(0);
  const [activeSide, setActiveSide] = useState<Side>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // タイマー更新
  useEffect(() => {
    if (activeSide && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (activeSide === 'left') {
          setLeftSeconds(prev => prev + 1);
        } else {
          setRightSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSide, startTime]);

  const startTimer = (side: Side) => {
    // 他の側が動いていたら止める
    if (activeSide && activeSide !== side) {
      stopTimer();
    }
    setActiveSide(side);
    setStartTime(Date.now());
  };

  const stopTimer = () => {
    setActiveSide(null);
    setStartTime(null);
  };

  const resetSide = (side: 'left' | 'right') => {
    if (activeSide === side) {
      stopTimer();
    }
    if (side === 'left') {
      setLeftSeconds(0);
    } else {
      setRightSeconds(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const leftMinutes = Math.floor(leftSeconds / 60);
    const rightMinutes = Math.floor(rightSeconds / 60);
    onSave(leftMinutes, rightMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            授乳タイマー
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* タイマーエリア */}
        <div className="space-y-4 mb-6">
          {/* 左側 */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${
            activeSide === 'left'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                左側
              </h3>
              <button
                onClick={() => resetSide('left')}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                disabled={activeSide === 'left'}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-5xl font-bold text-center mb-4 font-mono text-blue-600 dark:text-blue-400">
              {formatTime(leftSeconds)}
            </div>

            <button
              onClick={() => activeSide === 'left' ? stopTimer() : startTimer('left')}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                activeSide === 'left'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
              }`}
            >
              {activeSide === 'left' ? (
                <div className="flex items-center justify-center gap-2">
                  <Pause className="w-5 h-5" />
                  停止
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  開始
                </div>
              )}
            </button>
          </div>

          {/* 右側 */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${
            activeSide === 'right'
              ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-500'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                右側
              </h3>
              <button
                onClick={() => resetSide('right')}
                className="p-2 text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                disabled={activeSide === 'right'}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-5xl font-bold text-center mb-4 font-mono text-pink-600 dark:text-pink-400">
              {formatTime(rightSeconds)}
            </div>

            <button
              onClick={() => activeSide === 'right' ? stopTimer() : startTimer('right')}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                activeSide === 'right'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
              }`}
            >
              {activeSide === 'right' ? (
                <div className="flex items-center justify-center gap-2">
                  <Pause className="w-5 h-5" />
                  停止
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  開始
                </div>
              )}
            </button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={(leftSeconds === 0 && rightSeconds === 0) || activeSide !== null}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            記録
          </button>
        </div>

        {/* ヒント */}
        {activeSide && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            計測中... タイマーを停止してから記録してください
          </p>
        )}
      </div>
    </div>
  );
};
