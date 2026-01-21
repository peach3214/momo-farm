import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, TrendingUp, MapPin, Settings, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

const availableTabs = [
  { id: 'home', path: '/', icon: Home, label: 'ホーム' },
  { id: 'statistics', path: '/statistics', icon: BarChart3, label: '統計' },
  { id: 'dashboard', path: '/dashboard', icon: TrendingUp, label: '成長' },
  { id: 'outing', path: '/outing', icon: MapPin, label: 'おでかけ' },
  { id: 'calendar', path: '/calendar', icon: CalendarIcon, label: 'カレンダー' },
  { id: 'checkups', path: '/checkups', icon: CalendarIcon, label: '検診' },
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

            <div className="grid grid-cols-2 gap-3">
              {/* 選択されたタブ */}
              {mainTabs.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setShowMore(false);
                    }}
                    className={`
                      flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}

              {/* その他のタブ */}
              {otherTabs.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setShowMore(false);
                    }}
                    className={`
                      flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}

              {/* 設定 */}
              <button
                onClick={() => {
                  navigate(settingsTab.path);
                  setShowMore(false);
                }}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                  transition-colors duration-200
                  ${location.pathname === settingsTab.path
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }
                `}
              >
                <settingsTab.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{settingsTab.label}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom z-40">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          {mainTabs.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`
                  flex flex-col items-center justify-center gap-1 flex-1 h-full
                  transition-colors duration-200
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}

          {/* メニューボタン */}
          <button
            onClick={() => setShowMore(true)}
            className={`
              flex flex-col items-center justify-center gap-1 flex-1 h-full
              transition-colors duration-200
              ${isMoreActive
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}
          >
            <div className="relative">
              <Plus className="w-6 h-6" />
              {isMoreActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </div>
            <span className="text-xs font-medium">メニュー</span>
          </button>
        </div>
      </nav>
    </>
  );
};
