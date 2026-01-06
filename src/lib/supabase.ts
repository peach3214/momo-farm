import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 環境変数の検証
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '環境変数が設定されていません。.envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。'
  );
}

// Supabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ==========================================
// 認証ヘルパー関数
// ==========================================

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('ユーザー取得エラー:', error);
    return null;
  }

  return user;
};

/**
 * サインアップ
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * サインイン
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * サインアウト
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

// ==========================================
// ストレージヘルパー関数
// ==========================================

/**
 * 画像をアップロード
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'checkup-images'
): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('ユーザーがログインしていません');
  }

  // ファイル名をユニークにする
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
};

/**
 * 画像を削除
 */
export const deleteImage = async (
  url: string,
  bucket: string = 'checkup-images'
): Promise<void> => {
  // URLからパスを抽出
  const path = url.split(`/${bucket}/`)[1];

  if (!path) {
    throw new Error('無効な画像URLです');
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
};

// ==========================================
// リアルタイム購読ヘルパー
// ==========================================

/**
 * テーブルの変更を購読
 */
export const subscribeToTable = <T = any>(
  table: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T;
    old: T;
  }) => void
) => {
  const channel = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      callback
    )
    .subscribe();

  // クリーンアップ関数を返す
  return () => {
    supabase.removeChannel(channel);
  };
};
