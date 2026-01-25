import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Check } from 'lucide-react';
import { Home, BarChart3, TrendingUp, MapPin, Calendar as CalendarIcon, Thermometer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const availableTabs = [
  { id: 'home', path: '/', icon: Home, label: 'ホーム' },
  { id: 'statistics', path: '/statistics', icon: BarChart3, label: '統計' },
  { id: 'dashboard', path: '/dashboard', icon: TrendingUp, label: '成長' },
  { id: 'outing', path: '/outing', icon: MapPin, label: 'おでかけ' },
  { id: 'calendar', path: '/calendar', icon: CalendarIcon, label: 'カレンダー' },
  { id: 'checkups', path: '/checkups', icon: CalendarIcon, label: '検診' },
  { id: 'temperature', path: '/temperature', icon: Thermometer, label: '体温' },
];

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const Settings = () => {
  const navigate = useNavigate();
  const [selectedTabs, setSelectedTabs] = useState<string[]>(['home', 'statistics', 'dashboard']);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = localStorage.getItem('bottomNavTabs');
    if (saved) {
      setSelectedTabs(JSON.parse(saved));
    }
  };

  const saveSettings = (tabs: string[]) => {
    localStorage.setItem('bottomNavTabs', JSON.stringify(tabs));
    setSelectedTabs(tabs);
  };

  const toggleTab = (tabId: string) => {
    if (selectedTabs.includes(tabId)) {
      if (selectedTabs.length > 1) {
        saveSettings(selectedTabs.filter(id => id !== tabId));
      }
    } else {
      if (selectedTabs.length < 3) {
        saveSettings([...selectedTabs, tabId]);
      }
    }
  };

  const menuItems = [
    {
      id: 'navigation',
      title: 'ナビゲーション設定',
      description: 'ボトムナビに表示するタブ（3個まで）',
    },
    {
      id: 'pages',
      title: 'ページ管理',
      description: '各ページへ移動',
    },
    {
      id: 'export',
      title: 'データエクスポート',
      description: 'CSV形式でデータをダウンロード',
    },
    {
      id: 'about',
      title: 'アプリについて',
      description: 'バージョン情報・利用規約',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
            設定
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {menuItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === item.id ? 'rotate-90' : ''}`} />
            </button>

            {/* ナビゲーション設定 */}
            {activeSection === 'navigation' && item.id === 'navigation' && (
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  表示したいタブを3個選択してください
                </p>
                {availableTabs.map(tab => {
                  const Icon = tab.icon;
                  const isSelected = selectedTabs.includes(tab.id);
                  const canToggle = isSelected || selectedTabs.length < 3;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => toggleTab(tab.id)}
                      disabled={!canToggle}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500' 
                          : canToggle
                            ? 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                            : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {tab.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  選択中: {selectedTabs.length}/3
                </p>
              </div>
            )}

            {/* ページ管理 */}
            {activeSection === 'pages' && item.id === 'pages' && (
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                {availableTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {tab.label}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* データエクスポート */}
            {activeSection === 'export' && item.id === 'export' && (
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  すべての記録をCSV形式でダウンロード
                </p>
                <button
                  onClick={async () => {
                    const userId = await getUserId();
                    const { data } = await supabase
                      .from('logs')
                      .select('*')
                      .eq('user_id', userId)
                      .order('logged_at', { ascending: false });
                    
                    if (data) {
                      const csv = [
                        ['日時', '種類', 'メモ'].join(','),
                        ...data.map(log => [
                          new Date(log.logged_at).toLocaleString('ja-JP'),
                          log.log_type,
                          log.memo || ''
                        ].join(','))
                      ].join('\n');
                      
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `育児記録_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  CSVをダウンロード
                </button>
              </div>
            )}

            {/* アプリについて */}
            {activeSection === 'about' && item.id === 'about' && (
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">アプリ名:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">Momo Farm</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">バージョン:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">リポジトリ:</span>
                    <a 
                      href="https://github.com/peach3214/momo-farm" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};
