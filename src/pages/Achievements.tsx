import { useState, useMemo } from 'react';
import { useAchievements, Achievement } from '../hooks/useAchievements';
import { Trophy, Plus, Lock, Unlock, Star, Calendar, ChevronRight, Edit, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';

const BIRTH_DATE = new Date('2025-12-04'); // 誕生日

// 生後日数を計算
const calculateAge = () => {
  const today = new Date();
  const days = differenceInDays(today, BIRTH_DATE) + 1; // +1 for inclusive
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  return {
    totalDays: days,
    weeks,
    days: remainingDays,
    text: `生後${weeks}週${remainingDays}日`
  };
};

const DIFFICULTY_LABELS = {
  1: '★',
  2: '★★',
  3: '★★★',
  4: '★★★★',
  5: '★★★★★',
};

export const Achievements = () => {
  const { achievements, loading, addAchievement, unlockAchievement, updateAchievement, deleteAchievement, getStats, canUnlock } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    icon: '🏆',
    category: 'その他',
    difficulty: 1,
    target_days: null as number | null,
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    icon: '🏆',
    category: 'その他',
    difficulty: 1,
    target_days: null as number | null,
  });

  const stats = getStats();
  const age = useMemo(() => calculateAge(), []);

  // カテゴリ別に実績を分類
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, Achievement[]> = {};
    achievements.forEach(achievement => {
      const cat = achievement.category || 'その他';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(achievement);
    });
    return grouped;
  }, [achievements]);

  const categories = Object.keys(achievementsByCategory).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.title.trim()) return;
    
    try {
      await addAchievement({
        ...newAchievement,
        is_unlocked: false,
        unlocked_at: null,
        prerequisite_id: null,
        sort_order: achievements.length,
      });
      setNewAchievement({
        title: '',
        description: '',
        icon: '🏆',
        category: 'その他',
        difficulty: 1,
        target_days: null,
      });
      setIsAddingAchievement(false);
    } catch (error) {
      alert('実績の追加に失敗しました');
    }
  };

  const startEditing = (achievement: Achievement) => {
    setEditingAchievement(achievement.id);
    setEditForm({
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon,
      category: achievement.category,
      difficulty: achievement.difficulty,
      target_days: (achievement as any).target_days || null,
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateAchievement(id, editForm);
      setEditingAchievement(null);
    } catch (error) {
      alert('更新に失敗しました');
    }
  };

  const handleUnlock = async (achievement: Achievement) => {
    if (!canUnlock(achievement)) {
      alert('前提条件を満たしていません');
      return;
    }
    
    try {
      await unlockAchievement(achievement.id);
    } catch (error) {
      alert('実績の解除に失敗しました');
    }
  };

  const calculateProgress = (achievement: Achievement) => {
    const targetDays = (achievement as any).target_days;
    if (!targetDays || achievement.is_unlocked) return null;
    
    const progress = Math.min(100, Math.round((age.totalDays / targetDays) * 100));
    return progress;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="w-7 h-7 text-blue-600" />
            実績
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 生後日数表示 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">今日は</p>
              <p className="text-3xl font-bold">{age.text}</p>
              <p className="text-sm opacity-75 mt-1">（生後{age.totalDays}日目）</p>
            </div>
            <Calendar className="w-12 h-12 opacity-75" />
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">解除済み</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.unlocked}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">未解除</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.locked}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">合計</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">達成率</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.completionRate}%</p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* カテゴリ別実績リスト */}
        {categories.map(category => {
          const categoryAchievements = achievementsByCategory[category];
          const isExpanded = expandedCategories.has(category);
          const unlockedCount = categoryAchievements.filter(a => a.is_unlocked).length;
          const totalCount = categoryAchievements.length;

          return (
            <div key={category} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 overflow-hidden">
              {/* カテゴリヘッダー */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-6 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {category}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {unlockedCount}/{totalCount} 達成
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {totalCount > 0 && (
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* 実績リスト */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  {categoryAchievements.map(achievement => {
                    const progress = calculateProgress(achievement);
                    const isEditing = editingAchievement === achievement.id;

                    return (
                      <div key={achievement.id}>
                        {isEditing ? (
                          // 編集モード（続く）
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                placeholder="絵文字"
                                value={editForm.icon}
                                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                                maxLength={2}
                                className="w-16 px-3 py-2 text-center text-2xl border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                              />
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              placeholder="説明"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            
                            <div className="grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                placeholder="カテゴリ"
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                              
                              <select
                                value={editForm.difficulty}
                                onChange={(e) => setEditForm({ ...editForm, difficulty: parseInt(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                {[1, 2, 3, 4, 5].map(d => (
                                  <option key={d} value={d}>{DIFFICULTY_LABELS[d as keyof typeof DIFFICULTY_LABELS]}</option>
                                ))}
                              </select>

                              <input
                                type="number"
                                value={editForm.target_days || ''}
                                onChange={(e) => setEditForm({ ...editForm, target_days: e.target.value ? parseInt(e.target.value) : null })}
                                placeholder="目標日数"
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(achievement.id)}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingAchievement(null)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 表示モード
                          <div
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              achievement.is_unlocked
                                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                                : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* アイコン */}
                              <div className="text-4xl flex-shrink-0">
                                {achievement.is_unlocked ? achievement.icon : '🔒'}
                              </div>

                              {/* コンテンツ */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className={`text-lg font-bold ${achievement.is_unlocked ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {achievement.title}
                                  </h3>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {!achievement.is_unlocked && canUnlock(achievement) && (
                                      <button
                                        onClick={() => handleUnlock(achievement)}
                                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                                      >
                                        <Unlock className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEditing(achievement)}
                                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteAchievement(achievement.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {achievement.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                    {DIFFICULTY_LABELS[achievement.difficulty as keyof typeof DIFFICULTY_LABELS]}
                                  </span>
                                </div>

                                {/* 進捗バー */}
                                {progress !== null && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      <span>生後{age.totalDays}日 / {(achievement as any).target_days}日</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {achievement.is_unlocked && achievement.unlocked_at && (
                                  <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(achievement.unlocked_at), 'yyyy年M月d日', { locale: ja })}に達成
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 実績追加ボタン */}
        {isAddingAchievement ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="絵文字"
                value={newAchievement.icon}
                onChange={(e) => setNewAchievement({ ...newAchievement, icon: e.target.value })}
                maxLength={2}
                className="w-16 px-3 py-2 text-center text-2xl border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="実績名"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <textarea
              placeholder="説明"
              value={newAchievement.description}
              onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={newAchievement.category}
                onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })}
                placeholder="カテゴリ"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              
              <select
                value={newAchievement.difficulty}
                onChange={(e) => setNewAchievement({ ...newAchievement, difficulty: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d as keyof typeof DIFFICULTY_LABELS]}</option>
                ))}
              </select>

              <input
                type="number"
                value={newAchievement.target_days || ''}
                onChange={(e) => setNewAchievement({ ...newAchievement, target_days: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="目標日数"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddAchievement}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingAchievement(false);
                  setNewAchievement({
                    title: '',
                    description: '',
                    icon: '🏆',
                    category: 'その他',
                    difficulty: 1,
                    target_days: null,
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingAchievement(true)}
            className="w-full p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border-2 border-dashed border-blue-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            実績を追加
          </button>
        )}
      </main>
    </div>
  );
};
