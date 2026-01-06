import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Profile } from '../types/database';

export const ProfileSetup = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthday, setChildBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setChildName(data.child_name || '');
        setChildBirthday(data.child_birthday || '');
        
        // プロフィールが既に設定済みならホームへ
        if (data.child_birthday) {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('プロフィール読み込みエラー:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('ユーザーが見つかりません');

      const profileData: Partial<Profile> = {
        id: user.id,
        email: user.email!,
        child_name: childName || null,
        child_birthday: childBirthday,
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'プロフィールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              👶 プロフィール設定
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              お子様の情報を入力してください
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="childName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                お子様の名前（任意）
              </label>
              <input
                id="childName"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="例: 太郎"
              />
            </div>

            <div>
              <label
                htmlFor="childBirthday"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                誕生日 <span className="text-red-500">*</span>
              </label>
              <input
                id="childBirthday"
                type="date"
                value={childBirthday}
                onChange={(e) => setChildBirthday(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                生後◯日の計算に使用します
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {loading ? '保存中...' : '保存して始める'}
            </button>
          </form>

          {/* サインアウト */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSignOut}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
