import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Check, Baby, Plus, Minus } from 'lucide-react';
import { Home, BarChart3, TrendingUp, MapPin, Calendar as CalendarIcon, Thermometer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDiapers } from '../hooks/useDiapers';
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

export const Settings = () => {
  const navigate = useNavigate();
  const { totalCount, addDiapers, setCount } = useDiapers();
  const [babyName, setBabyName] = useState('');
  const [babyBirthday, setBabyBirthday] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<string[]>(['home', 'statistics', 'dashboard']);
  const [isDiaperModalOpen, setIsDiaperModalOpen] = useState(false);
  const [diaperInput, setDiaperInput] = useState('');

  useEffect(() => {
    fetchBabyInfo();
    const saved = localStorage.getItem('bottomNavTabs');
    if (saved) {
      setSelectedTabs(JSON.parse(saved));
    }
  }, []);

  const fetchBabyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || TEST_USER_ID;

      const { data, error } = await supabase
        .from('baby_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBabyName(data.name || '');
        setBabyBirthday(data.birthday || '');
      }
    } catch (error) {
      console.error('Error fetching baby info:', error);
    }
  };

  const saveBabyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || TEST_USER_ID;

      const { data: existing } = await supabase
        .from('baby_info')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('baby_info')
          .update({ name: babyName, birthday: babyBirthday })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('baby_info')
          .insert([{ user_id: userId, name: babyName, birthday: babyBirthday }]);
      }

      alert('保存しました');
    } catch (error) {
      console.error('Error saving baby info:', error);
      alert('保存に失敗しました');
    }
  };

  const toggleTab = (tabId: string) => {
    const newSelected = selectedTabs.includes(tabId)
      ? selectedTabs.filter(id => id !== tabId)
      : [...selectedTabs, tabId];

    if (newSelected.length >= 1 && newSelected.length <= 3) {
      setSelectedTabs(newSelected);
      localStorage.setItem('bottomNavTabs', JSON.stringify(newSelected));
    }
  };

  const handleAddDiapers = async () => {
    const count = parseInt(diaperInput);
    if (isNaN(count) || count <= 0) {
      alert('正しい数を入力してください');
      return;
    }

    try {
      await addDiapers(count);
      setIsDiaperModalOpen(false);
      setDiaperInput('');
    } catch (error) {
      alert('追加に失敗しました');
    }
  };

  const handleSetDiapers = async () => {
    const count = parseInt(diaperInput);
    if (isNaN(count) || count < 0) {
      alert('正しい数を入力してください');
      return;
    }

    try {
      await setCount(count);
      setIsDiaperModalOpen(false);
      setDiaperInput('');
    } catch (error) {
      alert('設定に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" />
            設定
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* おむつ在庫管理 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">おむつ在庫管理</h2>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">現在の在庫</p>
            <p className="text-4xl font-bold text-yellow-600">{totalCount}枚</p>
          </div>

          <button
            onClick={() => setIsDiaperModalOpen(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            在庫を追加・変更
          </button>
        </div>

        {/* 赤ちゃん情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">赤ちゃん情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                名前
              </label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="赤ちゃんの名前"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                誕生日
              </label>
              <input
                type="date"
                value={babyBirthday}
                onChange={(e) => setBabyBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <button
              onClick={saveBabyInfo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </div>

        {/* ボトムナビゲーション設定 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            ボトムナビゲーション
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            表示するタブを1〜3個選択してください
          </p>

          <div className="space-y-2">
            {availableTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = selectedTabs.includes(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => toggleTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
                    <span className={`font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {tab.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ページ管理 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">ページ管理</h2>
          
          <div className="space-y-2">
            {availableTabs.map(tab => {
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
        </div>
      </main>

      {/* おむつ在庫モーダル */}
      {isDiaperModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              おむつ在庫の管理
            </h2>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">現在の在庫</p>
              <p className="text-3xl font-bold text-yellow-600">{totalCount}枚</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                枚数を入力
              </label>
              <input
                type="number"
                value={diaperInput}
                onChange={(e) => setDiaperInput(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleAddDiapers}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                追加
              </button>
              <button
                onClick={handleSetDiapers}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-medium"
              >
                <SettingsIcon className="w-5 h-5" />
                設定
              </button>
            </div>

            <button
              onClick={() => {
                setIsDiaperModalOpen(false);
                setDiaperInput('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
