import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, TrendingUp, MapPin, Settings, Plus, Calendar as CalendarIcon, Thermometer, ShoppingCart, Trophy, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';

const availableTabs = [
  { id: 'home', path: '/', icon: Home, label: 'ホーム' },
  { id: 'statistics', path: '/statistics', icon: BarChart3, label: '統計' },
  { id: 'dashboard', path: '/dashboard', icon: TrendingUp, label: '成長' },
  { id: 'outing', path: '/outing', icon: MapPin, label: 'おでかけ' },
  { id: 'calendar', path: '/calendar', icon: CalendarIcon, label: 'カレンダー' },
  { id: 'checkups', path: '/checkups', icon: CalendarIcon, label: '検診' },
  { id: 'temperature', path: '/temperature', icon: Thermometer, label: '体温' },
  { id: 'shopping', path: '/shopping', icon: ShoppingCart, label: 'おかいもの' },
  { id: 'achievements', path: '/achievements', icon: Trophy, label: '実績' },
  { id: 'unit-price', path: '/unit-price', icon: Calculator, label: '単価計算' },
];

const settingsTab = { path: '/settings', icon: Settings, label: '設定' };

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>(['home', 'statistics', 'dashboard']);

  useEffect(() => {
    const saved = localStorage.getItem('bottomNavTabs');
    if (saved) {
      setSelectedTabIds(JSON.parse(saved));
    }
  }, []);

  // LocalStorageの変更を監視
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('bottomNavTabs');
      if (saved) {
        setSelectedTabIds(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorage);
    // 同一タブ内での変更も検知
    const interval = setInterval(() => {
      const saved = localStorage.getItem('bottomNavTabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) !== JSON.stringify(selectedTabIds)) {
          setSelectedTabIds(parsed);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [selectedTabIds]);

  const mainTabs = availableTabs.filter(tab => selectedTabIds.includes(tab.id));
  const otherTabs = availableTabs.filter(tab => !selectedTabIds.includes(tab.id));
  const isMoreActive = otherTabs.some(tab => tab.path === location.pathname) || location.pathname === '/settings';

  return (
    <>
      {/* モーダルメニュー */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowMore(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-2xl w-full p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">メニュー</h3>
              <button
                onClick={() => setShowMore(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* その他のタブ */}
            {otherTabs.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">ページ</h4>
                <div className="space-y-1">
                  {otherTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          navigate(tab.path);
                          setShowMore(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 設定 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">その他</h4>
              <button
                onClick={() => {
                  navigate(settingsTab.path);
                  setShowMore(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">{settingsTab.label}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {mainTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}

            {/* もっと見る */}
            <button
              onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                isMoreActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">もっと</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
