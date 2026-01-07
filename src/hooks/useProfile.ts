import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

// 固定のテストユーザーID
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// 現在のユーザーIDを取得
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = await getUserId();

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError) {
          // プロフィールが存在しない場合はデフォルト値を使用
          if (fetchError.code === 'PGRST116') {
            console.log('プロフィールが見つかりません。デフォルト値を使用します。');
            setProfile({
              id: userId,
              email: 'test@example.com',
              display_name: null,
              child_name: null,
              child_birthday: '2024-01-01', // デフォルトの誕生日
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            throw fetchError;
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError(err as Error);
        console.error('プロフィール取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    childBirthday: profile?.child_birthday ? new Date(profile.child_birthday) : null,
  };
};
