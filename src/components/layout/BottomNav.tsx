import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, TrendingUp, MapPin, Settings, Plus, Calendar as CalendarIcon, Thermometer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ShoppingCart, Trophy } from 'lucide-react';

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
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>(['home', 'statistics', 'dashboard']);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bottomNavTabs');
    if (saved) {
      setSelectedTabIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('bottomNavTabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) !== JSON.stringify(selectedTabIds)) {
          setSelectedTabIds(parsed);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedTabIds]);

  const selectedTabs = availableTabs.filter(tab => selectedTabIds.includes(tab.id));
  const otherTabs = availableTabs.filter(tab => !selectedTabIds.includes(tab.id) && tab.id !== 'settings');

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-60">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex justify-around items-center">
            {selectedTabs.map(tab => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative group"
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  <span className={`text-xs ${active ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {otherTabs.length > 0 && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative"
              >
                <Plus className={`w-6 h-6 ${showMenu ? 'text-blue-600 dark:text-blue-400 rotate-45' : 'text-gray-600 dark:text-gray-400'} transition-transform`} />
                <span className={`text-xs ${showMenu ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                  メニュー
                </span>
              </button>
            )}

            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative group"
            >
              <Settings className={`w-6 h-6 ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className={`text-xs ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                設定
              </span>
              {isActive('/settings') && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[180px]">
            {otherTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    navigate(tab.path);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};
