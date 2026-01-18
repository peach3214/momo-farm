import { useState, useEffect } from 'react';
import { MapPin, Plus, Check, X, Copy, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

interface OutingLocation {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistTemplate {
  id: string;
  user_id: string;
  name: string;
  items: string[];
  created_at: string;
}

export const Outing = () => {
  const [locations, setLocations] = useState<OutingLocation[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [templateName, setTemplateName] = useState('');

  // デフォルトのチェックリストアイテム
  const defaultItems = [
    'おむつ',
    'おしりふき',
    '着替え',
    'ミルク',
    '哺乳瓶',
    'タオル',
    '母子手帳',
    '保険証',
    'おもちゃ',
    'おやつ',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();

      // 場所を取得
      const { data: locationsData, error: locationsError } = await supabase
        .from('outing_locations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

      // テンプレートを取得
      const { data: templatesData, error: templatesError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // デフォルトのチェックリストを初期化
      if (checklist.length === 0) {
        setChecklist(defaultItems.map((text, index) => ({
          id: `default-${index}`,
          text,
          checked: false,
        })));
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      const userId = await getUserId();
      
      // Geocoding APIで住所から座標を取得（簡易版）
      // 本番ではGoogle Maps Geocoding APIなどを使用
      const latitude = 35.6762 + (Math.random() - 0.5) * 0.1; // 東京付近のランダム座標
      const longitude = 139.6503 + (Math.random() - 0.5) * 0.1;

      const { data, error } = await supabase
        .from('outing_locations')
        .insert({
          user_id: userId,
          location_name: newLocation,
          latitude,
          longitude,
          date: new Date().toISOString(),
          notes: newNotes || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setLocations([data, ...locations]);
      setNewLocation('');
      setNewNotes('');
      setShowLocationModal(false);
    } catch (error) {
      console.error('場所追加エラー:', error);
      alert('場所の追加に失敗しました');
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('outing_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLocations(locations.filter(loc => loc.id !== id));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    
    setChecklist([
      ...checklist,
      {
        id: `custom-${Date.now()}`,
        text: newItemText,
        checked: false,
      },
    ]);
    setNewItemText('');
  };

  const clearAllChecks = () => {
    setChecklist(checklist.map(item => ({ ...item, checked: false })));
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    try {
      const userId = await getUserId();
      
      const { data, error } = await supabase
        .from('checklist_templates')
        .insert({
          user_id: userId,
          name: templateName,
          items: checklist.map(item => item.text),
        })
        .select()
        .single();

      if (error) throw error;
      
      setTemplates([data, ...templates]);
      setTemplateName('');
      setShowTemplateModal(false);
      alert('テンプレートを保存しました');
    } catch (error) {
      console.error('テンプレート保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  const loadTemplate = (template: ChecklistTemplate) => {
    setChecklist(template.items.map((text, index) => ({
      id: `template-${template.id}-${index}`,
      text,
      checked: false,
    })));
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-green-600 dark:text-green-400" />
            おでかけ
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* マップとピン */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              おでかけマップ
            </h2>
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              記録
            </button>
          </div>

          {/* 簡易マップ（ピン表示） */}
          <div className="p-4">
            <div className="relative h-64 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
              {/* 背景グリッド */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-gray-400" style={{ top: `${i * 10}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-gray-400" style={{ left: `${i * 10}%` }} />
                ))}
              </div>

              {/* ピン */}
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className="absolute"
                  style={{
                    left: `${((location.longitude - 139.6) * 500) % 90 + 5}%`,
                    top: `${((location.latitude - 35.6) * 500) % 90 + 5}%`,
                  }}
                >
                  <div className="relative group">
                    <MapPin className="w-8 h-8 text-green-600 dark:text-green-400 drop-shadow-lg cursor-pointer hover:scale-110 transition-transform" fill="currentColor" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {location.location_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 記録リスト */}
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {locations.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                  まだ記録がありません
                </p>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {location.location_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(location.date).toLocaleDateString('ja-JP')}
                      </p>
                      {location.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {location.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteLocation(location.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* チェックリスト */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                持ち物チェックリスト
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllChecks}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  クリア
                </button>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>

            {/* テンプレート */}
            {templates.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {templates.map((template) => (
                  <div key={template.id} className="group relative">
                    <button
                      onClick={() => loadTemplate(template)}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {template.name}
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4">
            {/* チェックリストアイテム */}
            <div className="space-y-2 mb-4">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400"
                  />
                  <span className={`flex-1 ${item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {item.text}
                  </span>
                  {item.checked && (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </label>
              ))}
            </div>

            {/* アイテム追加 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                placeholder="アイテムを追加..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={addChecklistItem}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 場所追加モーダル */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              おでかけ先を記録
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  場所
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="例: 公園、スーパー、病院"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メモ（任意）
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="メモを入力..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={addLocation}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  記録
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* テンプレート保存モーダル */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              テンプレートとして保存
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  テンプレート名
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="例: 近場、遠出、病院"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveAsTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
