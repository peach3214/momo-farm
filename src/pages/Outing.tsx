import { useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, MapPin, X, Plus, Trash2, ChevronUp, Home as HomeIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

interface Location {
  id: string;
  user_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const Outing = () => {
  // 地図の初期位置（岡山・広島付近）
  const [viewState, setViewState] = useState({
    longitude: 133,
    latitude: 35,
    zoom: 12,
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(30); // パーセント
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // 表示モード

  const mapRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // データ取得
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('outing_locations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 検索処理（Nominatim API + zipcloud API）
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // 検索のデバウンス
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // 郵便番号検索（7桁の数字のみ）
        if (/^\d{7}$/.test(query)) {
          const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${query}`);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const address = `${result.address1}${result.address2}${result.address3}`;
            
            // 住所から座標を取得
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)},Japan&limit=1`,
              { headers: { 'Accept-Language': 'ja' } }
            );
            const geoData = await geoResponse.json();
            
            if (geoData.length > 0) {
              setSearchResults([{
                display_name: address,
                lat: geoData[0].lat,
                lon: geoData[0].lon,
              }]);
            }
          }
        } else {
          // 通常の名称検索（Nominatim）
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},Japan&limit=5`,
            { headers: { 'Accept-Language': 'ja' } }
          );
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('検索エラー:', error);
        setSearchResults([]);
      }
    }, 500);
  };

  // 検索結果を選択して地図を移動
  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // 地図を移動（FlyTo）
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 15,
        duration: 2000,
      });
    }

    setViewState({
      longitude: lon,
      latitude: lat,
      zoom: 15,
    });

    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 新しい場所を保存
  const saveLocation = async (name: string, lat: number, lon: number, visitDate?: string, notes?: string) => {
    try {
      const userId = await getUserId();
      
      const { data, error } = await supabase
        .from('outing_locations')
        .insert({
          user_id: userId,
          location_name: name,
          latitude: lat,
          longitude: lon,
          date: visitDate ? new Date(visitDate).toISOString() : new Date().toISOString(),
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setLocations([data, ...locations]);
      return data;
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
      return null;
    }
  };

  // 場所を削除
  const deleteLocation = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('outing_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLocations(locations.filter(loc => loc.id !== id));
      if (selectedLocation?.id === id) {
        setSelectedLocation(null);
        setShowBottomSheet(false);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // マーカーをクリックしたときの処理
  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
    setBottomSheetHeight(50);

    // 地図を選択した場所に移動
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1500,
      });
    }
  };

  // 地図の長押しで新しい場所を追加
  const handleMapClick = (event: any) => {
    const { lngLat } = event;
    const locationName = prompt('この場所の名前を入力してください:');
    
    if (locationName) {
      saveLocation(locationName, lngLat.lat, lngLat.lng);
    }
  };

  // ボトムシートのドラッグ
  const handleBottomSheetDrag = (e: React.TouchEvent | React.MouseEvent) => {
    // 簡易実装：実際はライブラリ（Vaul等）を使用推奨
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 地図表示（上半分） */}
      <div className="flex-1 relative">
        {/* 全画面地図 */}
        <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        mapStyle={{
          version: 8,
          sources: {
            'gsi-pale': {
              type: 'raster',
              tiles: [
                'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
            },
          },
          layers: [
            {
              id: 'gsi-pale-layer',
              type: 'raster',
              source: 'gsi-pale',
              minzoom: 0,
              maxzoom: 18,
            },
          ],
        }}
      >
        {/* ナビゲーションコントロール */}
        <NavigationControl position="bottom-right" style={{ marginBottom: '200px', marginRight: '16px' }} />

        {/* マーカー */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom"
            onClick={() => handleMarkerClick(location)}
          >
            <div className="relative cursor-pointer transform transition-transform hover:scale-110">
              <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" fill="currentColor" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                {location.location_name}
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* 検索バー（上部） */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-area-inset-top">
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="場所名や郵便番号で検索..."
              className="flex-1 px-2 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="p-2 mr-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 検索結果 */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden max-h-80 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {result.display_name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ホームボタン（初期位置に戻る） */}
      <button
        onClick={() => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [133, 35],
              zoom: 12,
              duration: 2000,
            });
          }
        }}
        className="absolute top-24 right-4 z-10 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:scale-110 transition-transform"
      >
        <HomeIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* ボトムシート */}
      {showBottomSheet && selectedLocation && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
          style={{ height: `${bottomSheetHeight}%` }}
        >
          {/* ドラッグハンドル */}
          <div
            className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleBottomSheetDrag}
            onMouseDown={handleBottomSheetDrag}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* コンテンツ */}
          <div className="px-6 pb-8 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
            {/* ヘッダー */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedLocation.location_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedLocation.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBottomSheet(false);
                  setSelectedLocation(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 座標情報 */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">緯度</p>
                  <p className="font-mono text-gray-900 dark:text-gray-100">
                    {selectedLocation.latitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">経度</p>
                  <p className="font-mono text-gray-900 dark:text-gray-100">
                    {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* メモ */}
            {selectedLocation.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  メモ
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedLocation.notes}
                </p>
              </div>
            )}

            {/* アクション */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [selectedLocation.longitude, selectedLocation.latitude],
                      zoom: 17,
                      duration: 1500,
                    });
                  }
                  setBottomSheetHeight(30);
                }}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-lg"
              >
                この場所を拡大
              </button>
              <button
                onClick={() => deleteLocation(selectedLocation.id)}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 説明テキスト（地図が空の場合） */}
      {locations.length === 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 px-6 py-4 max-w-sm">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            地図を長押しして、おでかけ先を記録しましょう 📍
          </p>
        </div>
      )}
      </div>

      {/* リスト表示（下半分・Flighty風） */}
      <div className="h-1/2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            記録 ({locations.length})
          </h2>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
              まだ記録がありません
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              地図を長押しして場所を記録しましょう
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {locations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleMarkerClick(location)}
                className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* アイコン */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                      <MapPin className="w-6 h-6 text-white" fill="white" />
                    </div>
                  </div>

                  {/* メイン情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                        {location.location_name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLocation(location.id);
                        }}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 日時 */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>
                        {new Date(location.date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(location.date).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* 座標情報 */}
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 font-mono mb-2">
                      <span>{location.latitude.toFixed(4)}°N</span>
                      <span>{location.longitude.toFixed(4)}°E</span>
                    </div>

                    {/* メモ */}
                    {location.notes && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {location.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
