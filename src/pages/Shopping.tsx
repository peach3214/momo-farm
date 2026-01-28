import { useState } from 'react';
import { useShopping } from '../hooks/useShopping';
import { ShoppingCart, Plus, ChevronDown, ChevronRight, ExternalLink, Trash2, Edit, Check, X } from 'lucide-react';

export const Shopping = () => {
  const { categories, items, loading, addCategory, addItem, updateItem, deleteItem, togglePurchased } = useShopping();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [newItem, setNewItem] = useState({ title: '', url: '', memo: '' });
  const [editForm, setEditForm] = useState({ title: '', url: '', memo: '' });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: '#6b7280',
        sort_order: categories.length,
      });
      setNewCategoryName('');
      setNewCategoryIcon('📦');
      setIsAddingCategory(false);
    } catch (error) {
      alert('カテゴリの追加に失敗しました');
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (!newItem.title.trim()) return;
    
    try {
      await addItem({
        category_id: categoryId,
        title: newItem.title,
        url: newItem.url || null,
        memo: newItem.memo || null,
        is_purchased: false,
        purchased_at: null,
        sort_order: items.filter(i => i.category_id === categoryId).length,
      });
      setNewItem({ title: '', url: '', memo: '' });
      setIsAddingItem(null);
    } catch (error) {
      alert('商品の追加に失敗しました');
    }
  };

  const startEditing = (item: any) => {
    setEditingItem(item.id);
    setEditForm({
      title: item.title,
      url: item.url || '',
      memo: item.memo || '',
    });
  };

  const handleUpdate = async (itemId: string) => {
    try {
      await updateItem(itemId, {
        title: editForm.title,
        url: editForm.url || null,
        memo: editForm.memo || null,
      });
      setEditingItem(null);
    } catch (error) {
      alert('更新に失敗しました');
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            おかいもの
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* カテゴリリスト */}
        {categories.map(category => {
          const categoryItems = getItemsByCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const purchasedCount = categoryItems.filter(i => i.is_purchased).length;
          const totalCount = categoryItems.length;

          return (
            <div key={category.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 overflow-hidden">
              {/* カテゴリヘッダー */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-3xl">{category.icon}</span>
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {purchasedCount}/{totalCount} 完了
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {totalCount > 0 && (
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                        style={{ width: `${(purchasedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* カテゴリアイテム */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-3">
                  {categoryItems.map(item => (
                    <div key={item.id}>
                      {editingItem === item.id ? (
                        // 編集モード
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-3">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <input
                            type="url"
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            placeholder="URL"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <textarea
                            value={editForm.memo}
                            onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                            placeholder="メモ"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(item.id)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
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
                            item.is_purchased
                              ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                              : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* チェックボックス */}
                            <button
                              onClick={() => togglePurchased(item.id, !item.is_purchased)}
                              className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                item.is_purchased
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                              }`}
                            >
                              {item.is_purchased && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </button>

                            {/* アイテム情報 */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold ${
                                item.is_purchased
                                  ? 'line-through text-gray-500 dark:text-gray-400'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {item.title}
                              </h3>
                              {item.memo && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {item.memo}
                                </p>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  リンクを開く
                                </a>
                              )}
                            </div>

                            {/* アクションボタン */}
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEditing(item)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* アイテム追加フォーム */}
                  {isAddingItem === category.id ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl space-y-3">
                      <input
                        type="text"
                        placeholder="商品名"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        type="url"
                        placeholder="URL（任意）"
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <textarea
                        placeholder="メモ（任意）"
                        value={newItem.memo}
                        onChange={(e) => setNewItem({ ...newItem, memo: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddItem(category.id)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
                        >
                          追加
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingItem(null);
                            setNewItem({ title: '', url: '', memo: '' });
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingItem(category.id)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      商品を追加
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* カテゴリ追加 */}
        {isAddingCategory ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-blue-100 dark:border-gray-700 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="絵文字"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                maxLength={2}
                className="w-16 px-3 py-2 text-center text-2xl border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="カテゴリ名"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                  setNewCategoryIcon('📦');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="w-full p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border-2 border-dashed border-blue-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            カテゴリを追加
          </button>
        )}
      </main>
    </div>
  );
};
