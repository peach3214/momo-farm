import { useState } from 'react';
import { useTemperature } from '../hooks/useTemperature';
import { Thermometer, Plus, TrendingUp, Calendar, Clock, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CONDITION_OPTIONS = [
  { value: 'good', label: '元気', icon: '😊', color: 'bg-green-100 text-green-700' },
  { value: 'tired', label: 'だるそう', icon: '😔', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'sleepy', label: '眠そう', icon: '😴', color: 'bg-blue-100 text-blue-700' },
  { value: 'crying', label: '泣いている', icon: '😭', color: 'bg-orange-100 text-orange-700' },
  { value: 'poor', label: 'ぐったり', icon: '😰', color: 'bg-red-100 text-red-700' },
];

export const Temperature = () => {
  const { terms, records, loading, addTerm, updateTerm, deleteTerm, addRecord, updateRecord, deleteRecord } = useTemperature();
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const [termForm, setTermForm] = useState({
    title: '',
    started_at: new Date().toISOString().split('T')[0],
    ended_at: '',
    notes: '',
  });

  const [recordForm, setRecordForm] = useState({
    temperature: '',
    measured_date: new Date().toISOString().split('T')[0],
    measured_time: new Date().toTimeString().slice(0, 5),
    condition: 'good',
    symptoms: '',
    medication: '',
    notes: '',
  });

  const selectedTerm = terms.find(t => t.id === selectedTermId);
  const selectedRecords = selectedTermId 
    ? records.filter(r => r.term_id === selectedTermId).sort((a, b) => 
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
      )
    : [];

  const chartData = selectedRecords.map(r => ({
    time: format(new Date(r.measured_at), 'M/d HH:mm'),
    temperature: r.temperature,
    condition: r.condition,
  }));

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTerm) {
        await updateTerm(editingTerm.id, {
          title: termForm.title,
          started_at: termForm.started_at,
          ended_at: termForm.ended_at || null,
          notes: termForm.notes || null,
        });
      } else {
        const newTerm = await addTerm({
          title: termForm.title,
          started_at: termForm.started_at,
          ended_at: termForm.ended_at || null,
          notes: termForm.notes || null,
        });
        if (newTerm) {
          setSelectedTermId(newTerm.id);
        }
      }
      setIsTermModalOpen(false);
      setEditingTerm(null);
      resetTermForm();
    } catch (error) {
      console.error('Error saving term:', error);
      alert('保存に失敗しました');
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;

    try {
      const data = {
        term_id: selectedTermId,
        temperature: parseFloat(recordForm.temperature),
        measured_at: `${recordForm.measured_date}T${recordForm.measured_time}:00`,
        condition: recordForm.condition,
        symptoms: recordForm.symptoms || null,
        medication: recordForm.medication || null,
        notes: recordForm.notes || null,
      };

      if (editingRecord) {
        await updateRecord(editingRecord.id, data);
      } else {
        await addRecord(data);
      }
      setIsRecordModalOpen(false);
      setEditingRecord(null);
      resetRecordForm();
    } catch (error) {
      console.error('Error saving record:', error);
      alert('保存に失敗しました');
    }
  };

  const resetTermForm = () => {
    setTermForm({
      title: '',
      started_at: new Date().toISOString().split('T')[0],
      ended_at: '',
      notes: '',
    });
  };

  const resetRecordForm = () => {
    setRecordForm({
      temperature: '',
      measured_date: new Date().toISOString().split('T')[0],
      measured_time: new Date().toTimeString().slice(0, 5),
      condition: 'good',
      symptoms: '',
      medication: '',
      notes: '',
    });
  };

  const handleEditTerm = (term: any) => {
    setEditingTerm(term);
    setTermForm({
      title: term.title,
      started_at: term.started_at,
      ended_at: term.ended_at || '',
      notes: term.notes || '',
    });
    setIsTermModalOpen(true);
  };

  const handleDeleteTerm = async (id: string) => {
    if (confirm('このタームを削除しますか？記録もすべて削除されます。')) {
      await deleteTerm(id);
      if (selectedTermId === id) {
        setSelectedTermId(null);
      }
    }
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    const [date, time] = record.measured_at.split('T');
    setRecordForm({
      temperature: record.temperature.toString(),
      measured_date: date,
      measured_time: time.slice(0, 5),
      condition: record.condition,
      symptoms: record.symptoms || '',
      medication: record.medication || '',
      notes: record.notes || '',
    });
    setIsRecordModalOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      await deleteRecord(id);
    }
  };

  const toggleTermExpansion = (termId: string) => {
    const newExpanded = new Set(expandedTerms);
    if (newExpanded.has(termId)) {
      newExpanded.delete(termId);
    } else {
      newExpanded.add(termId);
    }
    setExpandedTerms(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-orange-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
            <Thermometer className="w-7 h-7 text-orange-600" />
            体温記録
          </h1>
          <button
            onClick={() => {
              setEditingTerm(null);
              resetTermForm();
              setIsTermModalOpen(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            新しいタームを追加
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 選択中のターム */}
        {selectedTerm && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-orange-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-b border-orange-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedTerm.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(new Date(selectedTerm.started_at), 'yyyy年M月d日', { locale: ja })}
                    {selectedTerm.ended_at && ` 〜 ${format(new Date(selectedTerm.ended_at), 'M月d日', { locale: ja })}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTerm(selectedTerm)}
                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setSelectedTermId(null)}
                    className="px-3 py-1 text-sm bg-white/50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  resetRecordForm();
                  setIsRecordModalOpen(true);
                }}
                className="w-full mt-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                体温を記録
              </button>
            </div>

            {/* グラフ */}
            {chartData.length > 0 && (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">体温の推移</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      domain={[36, 40]}
                      ticks={[36, 37, 38, 39, 40]}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <ReferenceLine y={37.5} stroke="#f59e0b" strokeDasharray="3 3" label="平熱上限" />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 記録リスト */}
            <div className="p-6 pt-0">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                記録一覧 ({selectedRecords.length})
              </h3>
              <div className="space-y-3">
                {selectedRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    まだ記録がありません
                  </div>
                ) : (
                  selectedRecords.slice().reverse().map(record => {
                    const condition = CONDITION_OPTIONS.find(c => c.value === record.condition);
                    const isFever = record.temperature >= 37.5;
                    
                    return (
                      <div
                        key={record.id}
                        className={`rounded-2xl p-4 border-2 ${
                          isFever 
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className={`text-4xl font-bold mb-1 ${isFever ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                              {record.temperature}°C
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              {format(new Date(record.measured_at), 'M月d日（E） HH:mm', { locale: ja })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{condition?.icon}</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${condition?.color}`}>
                              {condition?.label}
                            </span>
                          </div>
                          {record.symptoms && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">症状：</span>{record.symptoms}
                            </div>
                          )}
                          {record.medication && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">服薬：</span>{record.medication}
                            </div>
                          )}
                          {record.notes && (
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">メモ：</span>{record.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* タームリスト */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-orange-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {selectedTermId ? '他のターム' : 'タームリスト'} ({terms.length})
          </h2>
          
          <div className="space-y-3">
            {terms.length === 0 ? (
              <div className="text-center py-12">
                <Thermometer className="w-16 h-16 text-orange-300 dark:text-orange-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">まだタームがありません</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">新しいタームを追加しましょう</p>
              </div>
            ) : (
              terms.map(term => {
                if (selectedTermId && term.id === selectedTermId) return null;
                
                const termRecords = records.filter(r => r.term_id === term.id);
                const isExpanded = expandedTerms.has(term.id);
                const maxTemp = termRecords.length > 0 
                  ? Math.max(...termRecords.map(r => r.temperature))
                  : null;

                return (
                  <div
                    key={term.id}
                    className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleTermExpansion(term.id)}
                      className="w-full p-4 text-left hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {term.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(term.started_at), 'M/d', { locale: ja })}
                              {term.ended_at && ` 〜 ${format(new Date(term.ended_at), 'M/d', { locale: ja })}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {termRecords.length}回記録
                            </span>
                            {maxTemp && (
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                最高 {maxTemp}°C
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {term.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {term.notes}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTermId(term.id)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                          >
                            詳細を見る
                          </button>
                          <button
                            onClick={() => handleEditTerm(term)}
                            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteTerm(term.id)}
                            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* タームモーダル */}
      {isTermModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingTerm ? 'タームを編集' : '新しいタームを追加'}
            </h2>

            <form onSubmit={handleTermSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={termForm.title}
                  onChange={(e) => setTermForm({ ...termForm, title: e.target.value })}
                  required
                  placeholder="例: 2026年1月の発熱"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    開始日 *
                  </label>
                  <input
                    type="date"
                    value={termForm.started_at}
                    onChange={(e) => setTermForm({ ...termForm, started_at: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    終了日
                  </label>
                  <input
                    type="date"
                    value={termForm.ended_at}
                    onChange={(e) => setTermForm({ ...termForm, ended_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  メモ
                </label>
                <textarea
                  value={termForm.notes}
                  onChange={(e) => setTermForm({ ...termForm, notes: e.target.value })}
                  rows={3}
                  placeholder="発熱の原因や経過などを記録"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsTermModalOpen(false);
                    setEditingTerm(null);
                    resetTermForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full transition-all shadow-lg"
                >
                  {editingTerm ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 記録モーダル */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingRecord ? '記録を編集' : '体温を記録'}
            </h2>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    体温 (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={recordForm.temperature}
                    onChange={(e) => setRecordForm({ ...recordForm, temperature: e.target.value })}
                    required
                    placeholder="37.5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    測定日 *
                  </label>
                  <input
                    type="date"
                    value={recordForm.measured_date}
                    onChange={(e) => setRecordForm({ ...recordForm, measured_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  測定時刻 *
                </label>
                <input
                  type="time"
                  value={recordForm.measured_time}
                  onChange={(e) => setRecordForm({ ...recordForm, measured_time: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  状態 *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRecordForm({ ...recordForm, condition: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        recordForm.condition === option.value
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  症状
                </label>
                <input
                  type="text"
                  value={recordForm.symptoms}
                  onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                  placeholder="例: 鼻水、咳"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  服薬
                </label>
                <input
                  type="text"
                  value={recordForm.medication}
                  onChange={(e) => setRecordForm({ ...recordForm, medication: e.target.value })}
                  placeholder="例: 解熱剤 5ml"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  メモ
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  rows={2}
                  placeholder="その他気になることなど"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    setEditingRecord(null);
                    resetRecordForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full transition-all shadow-lg"
                >
                  {editingRecord ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
