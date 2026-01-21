import { useState, useMemo } from 'react';
import { useCheckups } from '../hooks/useCheckups';
import { Calendar, Plus, Edit2, Trash2, Weight, Ruler, Baby, ChevronRight, CheckCircle, Circle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const CHECKUP_TYPES = [
  { value: 'newborn', label: '新生児訪問' },
  { value: '1month', label: '1ヶ月検診' },
  { value: '3month', label: '3〜4ヶ月検診' },
  { value: '6month', label: '6〜7ヶ月検診' },
  { value: '9month', label: '9〜10ヶ月検診' },
  { value: '1year', label: '1歳検診' },
  { value: '1.5year', label: '1歳6ヶ月検診' },
  { value: '3year', label: '3歳検診' },
  { value: 'custom', label: 'その他' },
];

export const Checkups = () => {
  const { checkups, loading, addCheckup, updateCheckup, deleteCheckup } = useCheckups();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    checkup_date: new Date().toISOString().split('T')[0],
    checkup_type: '1month',
    custom_type_name: '',
    height_cm: '',
    weight_g: '',
    head_circumference_cm: '',
    chest_circumference_cm: '',
    doctor_comments: '',
    next_time_notes: '',
    summary: '',
    tasks: [] as Array<{ text: string; completed: boolean }>,
  });

  const filteredCheckups = useMemo(() => {
    if (!searchQuery) return checkups;
    const query = searchQuery.toLowerCase();
    return checkups.filter(checkup => 
      checkup.summary?.toLowerCase().includes(query) ||
      checkup.doctor_comments?.toLowerCase().includes(query) ||
      CHECKUP_TYPES.find(t => t.value === checkup.checkup_type)?.label.includes(searchQuery)
    );
  }, [checkups, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      checkup_date: formData.checkup_date,
      checkup_type: formData.checkup_type,
    };

    if (formData.checkup_type === 'custom' && formData.custom_type_name) {
      data.custom_type_name = formData.custom_type_name;
    }

    if (formData.height_cm) {
      data.height_cm = parseFloat(formData.height_cm);
    }

    if (formData.weight_g) {
      data.weight_g = parseFloat(formData.weight_g) * 1000;
    }

    if (formData.head_circumference_cm) {
      data.head_circumference_cm = parseFloat(formData.head_circumference_cm);
    }

    if (formData.chest_circumference_cm) {
      data.chest_circumference_cm = parseFloat(formData.chest_circumference_cm);
    }

    if (formData.doctor_comments) {
      data.doctor_comments = formData.doctor_comments;
    }

    if (formData.next_time_notes) {
      data.next_time_notes = formData.next_time_notes;
    }

    if (formData.summary) {
      data.summary = formData.summary;
    }

    if (formData.tasks.length > 0) {
      data.tasks = formData.tasks;
    }

    try {
      if (editingCheckup) {
        await updateCheckup(editingCheckup.id, data);
      } else {
        await addCheckup(data);
      }

      setIsModalOpen(false);
      setEditingCheckup(null);
      resetForm();
    } catch (error) {
      console.error('Error saving checkup:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    }
  };

  const resetForm = () => {
    setFormData({
      checkup_date: new Date().toISOString().split('T')[0],
      checkup_type: '1month',
      custom_type_name: '',
      height_cm: '',
      weight_g: '',
      head_circumference_cm: '',
      chest_circumference_cm: '',
      doctor_comments: '',
      next_time_notes: '',
      summary: '',
      tasks: [],
    });
  };

  const handleEdit = (checkup: any) => {
    setEditingCheckup(checkup);
    setFormData({
      checkup_date: checkup.checkup_date,
      checkup_type: checkup.checkup_type,
      custom_type_name: checkup.custom_type_name || '',
      height_cm: checkup.height_cm?.toString() || '',
      weight_g: checkup.weight_g ? (checkup.weight_g / 1000).toString() : '',
      head_circumference_cm: checkup.head_circumference_cm?.toString() || '',
      chest_circumference_cm: checkup.chest_circumference_cm?.toString() || '',
      doctor_comments: checkup.doctor_comments || '',
      next_time_notes: checkup.next_time_notes || '',
      summary: checkup.summary || '',
      tasks: checkup.tasks || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この検診記録を削除しますか？')) {
      await deleteCheckup(id);
    }
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { text: '', completed: false }],
    });
  };

  const updateTask = (index: number, field: 'text' | 'completed', value: string | boolean) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-green-600 dark:text-green-400" />
            検診記録
          </h1>
          <button
            onClick={() => {
              setEditingCheckup(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            追加
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検診記録を検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* 検診記録一覧 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              検診記録 ({filteredCheckups.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredCheckups.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {searchQuery ? '検索結果がありません' : '検診記録がありません'}
              </div>
            ) : (
              filteredCheckups.map(checkup => {
                const typeName = checkup.checkup_type === 'custom' 
                  ? checkup.custom_type_name 
                  : CHECKUP_TYPES.find(t => t.value === checkup.checkup_type)?.label;

                return (
                  <div
                    key={checkup.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 cursor-pointer" onClick={() => handleEdit(checkup)}>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {typeName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(checkup.checkup_date), 'yyyy年M月d日（E）', { locale: ja })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(checkup);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(checkup.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {(checkup.height_cm || checkup.weight_g || checkup.head_circumference_cm) && (
                      <div className="flex gap-4 mb-2 text-sm">
                        {checkup.height_cm && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Ruler className="w-4 h-4" />
                            {checkup.height_cm} cm
                          </div>
                        )}
                        {checkup.weight_g && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Weight className="w-4 h-4" />
                            {(checkup.weight_g / 1000).toFixed(2)} kg
                          </div>
                        )}
                        {checkup.head_circumference_cm && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Baby className="w-4 h-4" />
                            {checkup.head_circumference_cm} cm
                          </div>
                        )}
                      </div>
                    )}

                    {checkup.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {checkup.summary}
                      </p>
                    )}

                    {checkup.tasks && checkup.tasks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {checkup.tasks.slice(0, 3).map((task: any, idx: number) => (
                          <div key={idx} className={`text-xs px-2 py-1 rounded ${task.completed ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                            {task.completed ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <Circle className="w-3 h-3 inline mr-1" />}
                            {task.text.length > 10 ? task.text.slice(0, 10) + '...' : task.text}
                          </div>
                        ))}
                        {checkup.tasks.length > 3 && (
                          <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            +{checkup.tasks.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingCheckup ? '検診記録を編集' : '検診記録を追加'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    日付 *
                  </label>
                  <input
                    type="date"
                    value={formData.checkup_date}
                    onChange={(e) => setFormData({ ...formData, checkup_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    検診の種類 *
                  </label>
                  <select
                    value={formData.checkup_type}
                    onChange={(e) => setFormData({ ...formData, checkup_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {CHECKUP_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.checkup_type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    検診名
                  </label>
                  <input
                    type="text"
                    value={formData.custom_type_name}
                    onChange={(e) => setFormData({ ...formData, custom_type_name: e.target.value })}
                    placeholder="例: 2ヶ月検診"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {/* 身体測定 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    身長 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight_g}
                    onChange={(e) => setFormData({ ...formData, weight_g: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    頭囲 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.head_circumference_cm}
                    onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    胸囲 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.chest_circumference_cm}
                    onChange={(e) => setFormData({ ...formData, chest_circumference_cm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* 医師のコメント */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  医師のコメント
                </label>
                <textarea
                  value={formData.doctor_comments}
                  onChange={(e) => setFormData({ ...formData, doctor_comments: e.target.value })}
                  rows={3}
                  placeholder="医師から言われたことを記録しましょう"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* タスク */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    今後のタスク
                  </label>
                  <button
                    type="button"
                    onClick={addTask}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + 追加
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.tasks.map((task, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => updateTask(idx, 'completed', e.target.checked)}
                        className="mt-1"
                      />
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTask(idx, 'text', e.target.value)}
                        placeholder="タスクを入力"
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(idx)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 次回に向けて */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  次回に向けて / 気をつけること
                </label>
                <textarea
                  value={formData.next_time_notes}
                  onChange={(e) => setFormData({ ...formData, next_time_notes: e.target.value })}
                  rows={2}
                  placeholder="次回の検診までに気をつけることなど"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* まとめ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  内容まとめ
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  placeholder="今回の検診の総括やメモ"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCheckup(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCheckup ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
