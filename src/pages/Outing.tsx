import { useState, useEffect, useRef } from 'react';
import { useOutings } from '../hooks/useOutings';
import { MapPin, Plus, Star, Heart, Edit2, Trash2, X, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const PLACE_CATEGORIES = [
  { value: 'park', label: '公園', icon: '🌳', color: 'bg-green-100 text-green-700' },
  { value: 'hospital', label: '病院', icon: '🏥', color: 'bg-red-100 text-red-700' },
  { value: 'cafe', label: 'カフェ', icon: '☕', color: 'bg-amber-100 text-amber-700' },
  { value: 'shop', label: 'お店', icon: '🛍️', color: 'bg-pink-100 text-pink-700' },
  { value: 'friend', label: '友達の家', icon: '🏠', color: 'bg-blue-100 text-blue-700' },
  { value: 'other', label: 'その他', icon: '📍', color: 'bg-gray-100 text-gray-700' },
];

export const Outing = () => {
  const { outings, loading, addOuting, updateOuting, deleteOuting } = useOutings();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [markers, setMarkers] = useState<maplibregl.Marker[]>([]);
  const [selectedOuting, setSelectedOuting] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOuting, setEditingOuting] = useState<any>(null);
  const [formData, setFormData] = useState({
    place_name: '',
    category: 'park',
    address: '',
    latitude: 34.3853,
    longitude: 132.4553,
    visited_at: new Date().toISOString().split('T')[0],
    notes: '',
    rating: 0,
    is_favorite: false,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // MapLibre地図の初期化
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [132.4553, 34.3853], // 広島
      zoom: 12,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapInstance.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // 逆ジオコーディング（Nominatim API使用）
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja`
        );
        const data = await response.json();
        
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error('Geocoding error:', error);
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        setIsModalOpen(true);
      }
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  // マーカーを表示
  useEffect(() => {
    if (!map) return;

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.remove());
    const newMarkers: maplibregl.Marker[] = [];

    outings.forEach(outing => {
      const category = PLACE_CATEGORIES.find(c => c.value === outing.category);
      
      // マーカー要素を作成
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.style.fontSize = '32px';
      el.textContent = category?.icon || '📍';
      el.addEventListener('click', () => {
        setSelectedOuting(outing);
        map.flyTo({ center: [outing.longitude, outing.latitude], zoom: 15 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([outing.longitude, outing.latitude])
        .addTo(map);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, outings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      place_name: formData.place_name,
      category: formData.category,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      visited_at: formData.visited_at,
      notes: formData.notes || null,
      rating: formData.rating || null,
      is_favorite: formData.is_favorite,
    };

    try {
      if (editingOuting) {
        await updateOuting(editingOuting.id, data);
      } else {
        await addOuting(data);
      }
      setIsModalOpen(false);
      setEditingOuting(null);
      resetForm();
    } catch (error) {
      console.error('Error saving outing:', error);
      alert('保存に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      place_name: '',
      category: 'park',
      address: '',
      latitude: 34.3853,
      longitude: 132.4553,
      visited_at: new Date().toISOString().split('T')[0],
      notes: '',
      rating: 0,
      is_favorite: false,
    });
  };

  const handleEdit = (outing: any) => {
    setEditingOuting(outing);
    setFormData({
      place_name: outing.place_name,
      category: outing.category,
      address: outing.address,
      latitude: outing.latitude,
      longitude: outing.longitude,
      visited_at: outing.visited_at,
      notes: outing.notes || '',
      rating: outing.rating || 0,
      is_favorite: outing.is_favorite || false,
    });
    setIsModalOpen(true);
    setSelectedOuting(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      await deleteOuting(id);
      setSelectedOuting(null);
    }
  };

  const favoriteOutings = outings.filter(o => o.is_favorite);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-pink-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <MapPin className="w-7 h-7 text-pink-600" />
            おでかけマップ
          </h1>
          <button
            onClick={() => {
              setEditingOuting(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            追加
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* お気に入りスポット */}
        {favoriteOutings.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-pink-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500 fill-current" />
              お気に入りスポット
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {favoriteOutings.map(outing => {
                const category = PLACE_CATEGORIES.find(c => c.value === outing.category);
                return (
                  <button
                    key={outing.id}
                    onClick={() => {
                      setSelectedOuting(outing);
                      map?.flyTo({ center: [outing.longitude, outing.latitude], zoom: 15 });
                    }}
                    className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-3 hover:shadow-lg transition-all"
                  >
                    <div className="text-3xl mb-2">{category?.icon}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {outing.place_name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* マップ */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-pink-100 dark:border-gray-700 overflow-hidden">
          <div 
            ref={mapContainerRef}
            className="w-full h-96 md:h-[500px]"
          />
          <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              💡 地図をタップして新しい場所を追加できます
            </p>
          </div>
        </div>

        {/* カテゴリ別リスト */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl border border-pink-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            おでかけ記録 ({outings.length})
          </h2>
          
          <div className="space-y-3">
            {outings.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-pink-300 dark:text-pink-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">まだ記録がありません</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">地図をタップして追加しましょう</p>
              </div>
            ) : (
              outings.map(outing => {
                const category = PLACE_CATEGORIES.find(c => c.value === outing.category);
                return (
                  <div
                    key={outing.id}
                    className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedOuting(outing);
                      map?.flyTo({ center: [outing.longitude, outing.latitude], zoom: 15 });
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{category?.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">
                            {outing.place_name}
                          </h3>
                          {outing.is_favorite && (
                            <Heart className="w-4 h-4 text-pink-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {format(new Date(outing.visited_at), 'yyyy年M月d日（E）', { locale: ja })}
                        </p>
                        {outing.rating > 0 && (
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < outing.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                        {outing.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {outing.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* 詳細ボトムシート */}
      {selectedOuting && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setSelectedOuting(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-t-3xl w-full p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">
                    {PLACE_CATEGORIES.find(c => c.value === selectedOuting.category)?.icon}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedOuting.place_name}
                  </h2>
                  {selectedOuting.is_favorite && (
                    <Heart className="w-5 h-5 text-pink-500 fill-current" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(selectedOuting.visited_at), 'yyyy年M月d日（E）', { locale: ja })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOuting(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedOuting.rating > 0 && (
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < selectedOuting.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">住所</div>
                <div className="text-gray-900 dark:text-gray-100">{selectedOuting.address}</div>
              </div>

              {selectedOuting.notes && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">メモ</div>
                  <div className="text-gray-900 dark:text-gray-100">{selectedOuting.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedOuting)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                編集
              </button>
              <button
                onClick={() => handleDelete(selectedOuting.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 追加/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full my-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingOuting ? 'おでかけを編集' : 'おでかけを追加'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  場所の名前 *
                </label>
                <input
                  type="text"
                  value={formData.place_name}
                  onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                  required
                  placeholder="例: ○○公園"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリ *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLACE_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.category === cat.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {cat.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  日付 *
                </label>
                <input
                  type="date"
                  value={formData.visited_at}
                  onChange={(e) => setFormData({ ...formData, visited_at: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  評価
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${rating <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="w-5 h-5 rounded text-pink-600"
                  />
                  <Heart className={`w-5 h-5 ${formData.is_favorite ? 'text-pink-500 fill-current' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    お気に入りに追加
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  メモ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="楽しかったことや気づいたことを記録しましょう"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingOuting(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full transition-all shadow-lg"
                >
                  {editingOuting ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
