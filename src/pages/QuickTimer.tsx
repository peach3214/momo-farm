import { useState, useEffect } from 'react';
import { X, Play, Pause, StopCircle } from 'lucide-react';

interface QuickTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (duration: number) => void;
  title: string;
  color: string;
}

export const QuickTimer = ({ isOpen, onClose, onSave, title, color }: QuickTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (seconds > 0) {
      onSave(seconds);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* タイマー表示 */}
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-8 mb-6`}>
          <div className="text-center">
            <div className="text-6xl font-bold text-white font-mono mb-2">
              {formatTime(seconds)}
            </div>
            {startTime && (
              <div className="text-sm text-white/80">
                開始: {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="grid grid-cols-3 gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="col-span-3 bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              開始
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-5 h-5" />
                一時停止
              </button>
              <button
                onClick={handleStop}
                className="col-span-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <StopCircle className="w-5 h-5" />
                終了して保存
              </button>
            </>
          )}
        </div>

        {seconds > 0 && !isRunning && (
          <button
            onClick={handleReset}
            className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
};
