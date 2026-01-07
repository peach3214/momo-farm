import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useCheckups } from '../hooks/useCheckups';
import { CheckupCard } from '../components/checkups/CheckupCard';
import { CheckupModal } from '../components/checkups/CheckupModal';
import type { Checkup, CheckupInsert } from '../types/database';

export const Checkups = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState<Checkup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const { checkups, loading, addCheckup, updateCheckup, deleteCheckup } = useCheckups();

  // フィルタリング
  const filteredCheckups = checkups.filter((checkup) => {
    // タイプフィルタ
    if (filterType !== 'all' && checkup.checkup_type !== filterType) {
      return false;
    }

    // 検索フィルタ
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const checkupTypeName = checkup.checkup_type === 'custom' && checkup.custom_type_name
        ? checkup.custom_type_name
        : checkup.checkup_type;
      
      return (
        checkupTypeName.toLowerCase().includes(searchLower) ||
        checkup.summary?.toLowerCase().includes(searchLower) ||
        checkup.doctor_comments?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // 検診追加
  const handleAdd = () => {
    setEditingCheckup(null);
    setModalOpen(true);
  };

  // 検診編集
  const handleEdit = (checkup: Checkup) => {
    setEditingCheckup(checkup);
    setModalOpen(true);
  };

  // 検診保存
  const handleSubmit = async (data: Omit<CheckupInsert, 'user_id'>) => {
    if (editingCheckup) {
      await updateCheckup(editingCheckup.id, data);
    } else {
      await addCheckup(data);
    }
    setModalOpen(false);
    setEditingCheckup(null);
  };

  const checkupTypeOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'newborn_visit', label: '新生児訪問' },
    { value: '1month', label: '1ヶ月検診' },
    { value: '3month', label: '3ヶ月検診' },
    { value: '6month', label: '6ヶ月検診' },
    { value: '9month', label: '9ヶ月検診' },
    { value: '12month', label: '12ヶ月検診' },
    { value: '18month', label: '18ヶ月検診' },
    { value: '36month', label: '3歳児検診' },
    { value: 'custom', label: 'その他' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              小児検診
            </h1>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>検診追加</span>
            </button>
          </div>

          {/* 検索とフィルタ */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 検索 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検診を検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* フィルタ */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {checkupTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 検診一覧 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCheckups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              {searchQuery || filterType !== 'all'
                ? '検索条件に一致する検診がありません'
                : 'まだ検診記録がありません'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              右上のボタンから検診記録を追加しましょう
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCheckups.map((checkup) => (
              <CheckupCard
                key={checkup.id}
                checkup={checkup}
                onEdit={() => handleEdit(checkup)}
                onDelete={() => deleteCheckup(checkup.id)}
                onClick={() => handleEdit(checkup)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 検診追加・編集モーダル */}
      <CheckupModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCheckup(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCheckup || undefined}
      />
    </div>
  );
};
