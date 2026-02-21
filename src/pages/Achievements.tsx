import { useState, useMemo } from 'react';
import { useAchievements, Achievement } from '../hooks/useAchievements';
import { Trophy, Plus, Lock, Star, Calendar, Edit, Trash2, Check, X, ChevronDown, ChevronRight, Sparkles, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';

const BIRTH_DATE = new Date('2025-12-03'); // 誕生日

// 生後日数を計算
const calculateAge = () => {
  const today = new Date();
  const days = differenceInDays(today, BIRTH_DATE) + 1;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  return {
    totalDays: days,
    weeks,
    days: remainingDays,
    text: `生後${weeks}週${remainingDays}日`
  };
};

// カテゴリの色設定
const CATEGORY_COLORS: Record<string, { gradient: string; icon: string }> = {
  '成長': { gradient: 'from-green-500 to-emerald-500', icon: '🌱' },
  '予防接種': { gradient: 'from-blue-500 to-cyan-500', icon: '💉' },
  'イベント': { gradient: 'from-pink-500 to-rose-500', icon: '🎉' },
  '食事': { gradient: 'from-orange-500 to-amber-500', icon: '🍼' },
  '睡眠': { gradient: 'from-indigo-500 to-purple-500', icon: '😴' },
  'その他': { gradient: 'from-gray-500 to-slate-500', icon: '⭐' },
};

export const Achievements = () => {
  const { achievements, loading, addAchievement, unlockAchievement, updateAchievement, deleteAchievement } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '⭐' });
  
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    icon: '🏆',
    category: '成長',
    series: '', // シリーズ名（例: "生後日数"）
    stage: 1, // 段階（1, 2, 3...）
    target_days: null as number | null,
    unlocked_at: null as string | null,
  });
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    icon: '🏆',
    category: '成長',
    series: '',
    stage: 1,
    target_days: null as number | null,
    unlocked_at: null as string | null,
  });

  const age = calculateAge();

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const cats = new Set(achievements.map(a => a.category));
    return Array.from(cats);
  }, [achievements]);

  // シリーズごとにグループ化
  const achievementsBySeries = useMemo(() => {
    const filtered = selectedCategory
      ? achievements.filter(a => a.category === selectedCategory)
      : achievements;

    const grouped = new Map<string, Achievement[]>();
    
    filtered.forEach(achievement => {
      const series = achievement.series || '未分類';
      if (!grouped.has(series)) {
        grouped.set(series, []);
      }
      grouped.get(series)!.push(achievement);
    });

    // 各シリーズ内でstageでソート
    grouped.forEach((items, key) => {
      items.sort((a, b) => (a.stage || 0) - (b.stage || 0));
    });

    return grouped;
  }, [achievements, selectedCategory]);

  // 統計情報
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.is_unlocked).length;
    const byCategory = categories.map(cat => ({
      category: cat,
      total: achievements.filter(a => a.category === cat).length,
      unlocked: achievements.filter(a => a.category === cat && a.is_unlocked).length,
    }));

    return { total, unlocked, percentage: total > 0 ? (unlocked / total) * 100 : 0, byCategory };
  }, [achievements, categories]);

  const toggleSeries = (series: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(series)) {
      newExpanded.delete(series);
    } else {
      newExpanded.add(series);
    }
    setExpandedSeries(newExpanded);
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.title.trim()) return;

    await addAchievement({
      title: newAchievement.title,
      description: newAchievement.description,
      icon: newAchievement.icon,
      category: newAchievement.category,
      series: newAchievement.series || undefined,
      stage: newAchievement.stage,
      target_days: newAchievement.target_days || undefined,
      is_unlocked: !!newAchievement.unlocked_at,
      unlocked_at: newAchievement.unlocked_at || undefined,
      prerequisite_id: undefined,
      sort_order: achievements.length,
    });

    setNewAchievement({
      title: '',
      description: '',
      icon: '🏆',
      category: '成長',
      series: '',
      stage: 1,
      target_days: null,
      unlocked_at: null,
    });
    setIsAddingAchievement(false);
  };

  const startEditingAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement.id);
    setEditForm({
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon || '🏆',
      category: achievement.category || '成長',
      series: achievement.series || '',
      stage: achievement.stage || 1,
      target_days: achievement.target_days || null,
      unlocked_at: achievement.unlocked_at || null,
    });
  };

  const handleUpdateAchievement = async (id: string) => {
    await updateAchievement(id, {
      title: editForm.title,
      description: editForm.description,
      icon: editForm.icon,
      category: editForm.category,
      series: editForm.series || undefined,
      stage: editForm.stage,
      target_days: editForm.target_days || undefined,
      is_unlocked: !!editForm.unlocked_at,
      unlocked_at: editForm.unlocked_at || undefined,
    });
    setEditingAchievement(null);
  };

  const handleUnlock = async (id: string) => {
    await unlockAchievement(id);
  };

  const addNewCategory = () => {
    if (!newCategory.name.trim()) return;
    
    // カテゴリをCATEGORY_COLORSに追加（実際のアプリでは永続化が必要）
    setNewCategory({ name: '', icon: '⭐' });
    setIsAddingCategory(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-purple-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Trophy className="w-7 h-7 text-purple-600" />
              実績
            </h1>
            <button
              onClick={() => setIsAddingAchievement(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              追加
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 生後日数カード */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">現在の記録</p>
              <h2 className="text-4xl font-bold mb-2">{age.text}</h2>
              <p className="text-sm opacity-90">合計 {age.totalDays} 日</p>
            </div>
            <div className="text-right">
              <div className="text-6xl mb-2">👶</div>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              達成状況
            </h3>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.unlocked}/{stats.total}
            </span>
          </div>
          
          {/* プログレスバー */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            達成率 {stats.percentage.toFixed(1)}%
          </p>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            すべて
          </button>
          {categories.map(category => {
            const config = CATEGORY_COLORS[category] || CATEGORY_COLORS['その他'];
            const catStats = stats.byCategory.find(s => s.category === category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === category
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{config.icon}</span>
                {category}
                {catStats && (
                  <span className="text-xs opacity-75">
                    ({catStats.unlocked}/{catStats.total})
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-4 py-2 rounded-xl font-medium whitespace-nowrap bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-dashed border-gray-400 dark:border-gray-600 hover:border-purple-500 transition-all"
          >
            <Plus className="w-4 h-4 inline" /> カテゴリ追加
          </button>
        </div>

        {/* シリーズ別実績リスト */}
        <div className="space-y-4">
          {Array.from(achievementsBySeries.entries()).map(([series, items]) => {
            const isExpanded = expandedSeries.has(series);
            const unlockedCount = items.filter(a => a.is_unlocked).length;
            const totalCount = items.length;
            const progress = (unlockedCount / totalCount) * 100;

            return (
              <div
                key={series}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 overflow-hidden"
              >
                {/* シリーズヘッダー */}
                <button
                  onClick={() => toggleSeries(series)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        {series}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {unlockedCount}/{totalCount} 達成
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* プログレスリング */}
                    <div className="relative w-12 h-12">
                      <svg className="transform -rotate-90" width="48" height="48">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                          className="text-purple-500 transition-all duration-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                </button>

                {/* 実績リスト */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    {items.map((achievement, index) => {
                      const isEditing = editingAchievement === achievement.id;
                      const prevAchievement = index > 0 ? items[index - 1] : null;
                      const isLocked = prevAchievement && !prevAchievement.is_unlocked;

                      return (
                        <div
                          key={achievement.id}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            achievement.is_unlocked
                              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-600'
                              : isLocked
                              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isEditing ? (
                            // 編集モード
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editForm.icon}
                                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                                  className="px-3 py-2 border rounded-xl text-center text-2xl"
                                  placeholder="🏆"
                                />
                                <input
                                  type="number"
                                  value={editForm.stage}
                                  onChange={(e) => setEditForm({ ...editForm, stage: Number(e.target.value) })}
                                  className="px-3 py-2 border rounded-xl"
                                  placeholder="段階"
                                  min="1"
                                />
                              </div>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded-xl"
                                placeholder="タイトル"
                              />
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-xl"
                                placeholder="説明"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                  className="px-3 py-2 border rounded-xl"
                                >
                                  {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={editForm.series}
                                  onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                                  className="px-3 py-2 border rounded-xl"
                                  placeholder="シリーズ名"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  value={editForm.target_days || ''}
                                  onChange={(e) => setEditForm({ ...editForm, target_days: e.target.value ? Number(e.target.value) : null })}
                                  className="px-3 py-2 border rounded-xl"
                                  placeholder="目標日数"
                                />
                                <input
                                  type="date"
                                  value={editForm.unlocked_at ? editForm.unlocked_at.split('T')[0] : ''}
                                  onChange={(e) => setEditForm({ ...editForm, unlocked_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                  className="px-3 py-2 border rounded-xl"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateAchievement(achievement.id)}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
                                >
                                  <Check className="w-4 h-4 inline" /> 保存
                                </button>
                                <button
                                  onClick={() => setEditingAchievement(null)}
                                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400"
                                >
                                  <X className="w-4 h-4 inline" /> キャンセル
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 表示モード
                            <>
                              <div className="flex items-start gap-3">
                                {/* アイコン */}
                                <div className={`text-4xl ${isLocked ? 'grayscale opacity-50' : ''}`}>
                                  {isLocked ? '🔒' : achievement.icon}
                                </div>

                                {/* コンテンツ */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                                      Stage {achievement.stage}
                                    </span>
                                    {achievement.target_days && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        <Target className="w-3 h-3 inline" /> {achievement.target_days}日目標
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {achievement.title}
                                  </h4>
                                  {achievement.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {achievement.description}
                                    </p>
                                  )}
                                  {achievement.unlocked_at && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(achievement.unlocked_at), 'yyyy/MM/dd', { locale: ja })} 達成
                                    </p>
                                  )}
                                </div>

                                {/* アクションボタン */}
                                <div className="flex flex-col gap-2">
                                  {!achievement.is_unlocked && !isLocked && (
                                    <button
                                      onClick={() => handleUnlock(achievement.id)}
                                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 flex items-center gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      解除
                                    </button>
                                  )}
                                  <button
                                    onClick={() => startEditingAchievement(achievement)}
                                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('この実績を削除しますか？')) {
                                        deleteAchievement(achievement.id);
                                      }
                                    }}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* 進行線 */}
                              {index < items.length - 1 && (
                                <div className="absolute left-8 bottom-0 w-0.5 h-4 bg-gray-300 dark:bg-gray-600 translate-y-full" />
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 実績追加モーダル */}
      {isAddingAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-600" />
              新しい実績を追加
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAchievement.icon}
                  onChange={(e) => setNewAchievement({ ...newAchievement, icon: e.target.value })}
                  className="px-3 py-2 border rounded-xl text-center text-2xl"
                  placeholder="🏆"
                />
                <input
                  type="number"
                  value={newAchievement.stage}
                  onChange={(e) => setNewAchievement({ ...newAchievement, stage: Number(e.target.value) })}
                  className="px-3 py-2 border rounded-xl"
                  placeholder="段階"
                  min="1"
                />
              </div>
              <input
                type="text"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="タイトル（例: 生後10日達成）"
              />
              <input
                type="text"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="説明（例: 生後10日を迎えました！）"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newAchievement.category}
                  onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })}
                  className="px-3 py-2 border rounded-xl"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newAchievement.series}
                  onChange={(e) => setNewAchievement({ ...newAchievement, series: e.target.value })}
                  className="px-3 py-2 border rounded-xl"
                  placeholder="シリーズ名"
                />
              </div>
              <input
                type="number"
                value={newAchievement.target_days || ''}
                onChange={(e) => setNewAchievement({ ...newAchievement, target_days: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="目標日数（例: 10）"
              />
              <input
                type="date"
                value={newAchievement.unlocked_at ? newAchievement.unlocked_at.split('T')[0] : ''}
                onChange={(e) => setNewAchievement({ ...newAchievement, unlocked_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="達成日（任意）"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddingAchievement(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddAchievement}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ追加モーダル */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              カテゴリを追加
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-center text-2xl"
                placeholder="アイコン（例: 🎯）"
              />
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="カテゴリ名（例: 健康）"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddingCategory(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={addNewCategory}
                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl font-medium"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
