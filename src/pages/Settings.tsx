import { useState } from 'react';
import { Settings as SettingsIcon, Download, Database, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useLogs } from '../hooks/useLogs';
import { useCheckups } from '../hooks/useCheckups';
import { exportLogsToCSV, exportCheckupsToCSV, downloadCSV } from '../utils/exportUtils';

export const Settings = () => {
  const [exporting, setExporting] = useState(false);
  const { logs } = useLogs({ date: new Date() });
  const { checkups } = useCheckups();

  const handleExportLogs = async () => {
    setExporting(true);
    try {
      // 実際には全期間のログを取得する必要がある
      const csvContent = exportLogsToCSV(logs);
      const filename = `育児記録_${format(new Date(), 'yyyyMMdd')}.csv`;
      downloadCSV(csvContent, filename);
      alert('データをエクスポートしました！');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCheckups = async () => {
    setExporting(true);
    try {
      const csvContent = exportCheckupsToCSV(checkups);
      const filename = `検診記録_${format(new Date(), 'yyyyMMdd')}.csv`;
      downloadCSV(csvContent, filename);
      alert('検診データをエクスポートしました！');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
            設定
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* データエクスポート */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              データエクスポート
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              記録をCSVファイルでダウンロードできます
            </p>
          </div>

          <div className="p-4 space-y-3">
            <button
              onClick={handleExportLogs}
              disabled={exporting || logs.length === 0}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              育児記録をエクスポート
            </button>

            <button
              onClick={handleExportCheckups}
              disabled={exporting || checkups.length === 0}
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              検診記録をエクスポート
            </button>

            {logs.length === 0 && checkups.length === 0 && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                エクスポートできるデータがありません
              </p>
            )}
          </div>
        </div>

        {/* データ統計 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            データ統計
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">育児記録</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {logs.length}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">件</span>
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">検診記録</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {checkups.length}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">件</span>
              </p>
            </div>
          </div>
        </div>

        {/* アプリ情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            アプリ情報
          </h2>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>アプリ名</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Momo Farm</span>
            </div>
            <div className="flex justify-between">
              <span>バージョン</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>開発</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">2026</span>
            </div>
          </div>
        </div>

        {/* 使い方のヒント */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            💡 使い方のヒント
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• ホーム画面でクイックアクションボタンをタップして記録を追加</li>
            <li>• カレンダーで予定を管理して検診を忘れずに</li>
            <li>• 成長グラフで赤ちゃんの成長を視覚的に確認</li>
            <li>• 統計ページで授乳間隔や睡眠時間をチェック</li>
            <li>• データエクスポートでバックアップを定期的に取得</li>
          </ul>
        </div>
      </main>
    </div>
  );
};
