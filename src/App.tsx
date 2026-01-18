import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home as HomeIcon, Calendar as CalendarIcon, ClipboardList, Menu, X, BarChart3, PieChart, Settings as SettingsIcon, MapPin } from 'lucide-react';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Checkups } from './pages/Checkups';
import { Dashboard } from './pages/Dashboard';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { Outing } from './pages/Outing';

function Navigation() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'ホーム' },
    { path: '/statistics', icon: PieChart, label: '統計' },
    { path: '/dashboard', icon: BarChart3, label: '成長' },
    { path: '/calendar', icon: CalendarIcon, label: 'カレンダー' },
    { path: '/outing', icon: MapPin, label: 'おでかけ' },
    { path: '/checkups', icon: ClipboardList, label: '検診' },
    { path: '/settings', icon: SettingsIcon, label: '設定' },
  ];

  return (
    <>
      {/* デスクトップ: ボトムナビゲーション（主要5つ） */}
      <nav className="hidden sm:block fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-5 gap-2 py-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* モバイル: ハンバーガーメニュー */}
      <div className="sm:hidden">
        {/* ハンバーガーボタン */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          ) : (
            <Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          )}
        </button>

        {/* メニュー */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)}>
            <div
              className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-20 pb-6 px-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/outing" element={<Outing />} />
          <Route path="/checkups" element={<Checkups />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
