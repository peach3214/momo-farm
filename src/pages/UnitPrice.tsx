import { useState } from 'react';
import { Calculator, Plus, Trash2, RefreshCw } from 'lucide-react';

interface PriceItem {
  id: string;
  price: string;
  quantity: string;
}

export const UnitPrice = () => {
  const [items, setItems] = useState<PriceItem[]>([
    { id: '1', price: '', quantity: '' },
  ]);

  const addItem = () => {
    if (items.length < 5) {
      setItems([...items, { id: Date.now().toString(), price: '', quantity: '' }]);
    }
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: 'price' | 'quantity', value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const clearAll = () => {
    setItems([{ id: Date.now().toString(), price: '', quantity: '' }]);
  };

  const calculateUnitPrice = (price: string, quantity: string) => {
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || isNaN(q) || q === 0) return null;
    return p / q;
  };

  // 単価を計算して最安値を特定
  const itemsWithUnitPrice = items.map(item => ({
    ...item,
    unitPrice: calculateUnitPrice(item.price, item.quantity),
  }));

  const validItems = itemsWithUnitPrice.filter(item => item.unitPrice !== null);
  const minUnitPrice = validItems.length > 0 
    ? Math.min(...validItems.map(item => item.unitPrice!))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-green-100 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Calculator className="w-7 h-7 text-green-600" />
            単価計算
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* 説明 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-sm border border-green-100 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 金額と量を入力すると、単価（1gあたりの価格）が自動計算されます
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const unitPrice = calculateUnitPrice(item.price, item.quantity);
            const isCheapest = unitPrice !== null && unitPrice === minUnitPrice && validItems.length > 1;

            return (
              <div 
                key={item.id} 
                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border-2 transition-all ${
                  isCheapest 
                    ? 'border-green-500 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-900' 
                    : 'border-green-100 dark:border-gray-700'
                } p-4`}
              >
                <div className="flex items-center gap-3">
                  {/* 番号 */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isCheapest 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* 入力欄 */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">金額（円）</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        placeholder="1000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">量（g）</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        placeholder="300"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>

                  {/* 単価表示 */}
                  <div className="flex-shrink-0 w-32 text-right">
                    {unitPrice !== null ? (
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">単価</div>
                        <div className={`text-lg font-bold ${
                          isCheapest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          ¥{unitPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">/g</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 dark:text-gray-500">-</div>
                    )}
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 最安値バッジ */}
                {isCheapest && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <span>🏆 最安値</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          {items.length < 5 && (
            <button
              onClick={addItem}
              className="flex-1 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-dashed border-green-300 dark:border-gray-600 text-green-600 dark:text-green-400 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              項目を追加（{items.length}/5）
            </button>
          )}
          
          {items.length > 1 && (
            <button
              onClick={clearAll}
              className="px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              リセット
            </button>
          )}
        </div>

        {/* 比較結果 */}
        {validItems.length > 1 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              比較結果
            </h2>
            <div className="space-y-2">
              {validItems
                .sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0))
                .map((item, index) => {
                  const itemIndex = items.findIndex(i => i.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">{index + 1}位</span>
                        <span>商品{itemIndex + 1}</span>
                        <span className="text-sm opacity-90">
                          ¥{item.price} / {item.quantity}g
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">¥{item.unitPrice!.toFixed(2)}</div>
                        <div className="text-sm opacity-75">/g</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
