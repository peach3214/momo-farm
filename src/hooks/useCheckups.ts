import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Checkup, CheckupInsert, CheckupUpdate } from '../types/database';

// 固定のテストユーザーID
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// 現在のユーザーIDを取得
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useCheckups = () => {
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ユーザーIDを取得
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // 検診を取得
  const fetchCheckups = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('checkups')
        .select('*')
        .eq('user_id', userId)
        .order('checkup_date', { ascending: false });

      if (fetchError) throw fetchError;

      setCheckups(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('検診取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 検診を追加
  const addCheckup = useCallback(async (checkupData: Omit<CheckupInsert, 'user_id'>) => {
    if (!userId) {
      throw new Error('ユーザーIDが取得できません');
    }

    try {
      const newCheckup: CheckupInsert = {
        ...checkupData,
        user_id: userId,
      };

      const { data, error: insertError } = await supabase
        .from('checkups')
        .insert(newCheckup)
        .select()
        .single();

      if (insertError) throw insertError;

      setCheckups((prev) => [data, ...prev]);

      return data;
    } catch (err) {
      console.error('検診追加エラー:', err);
      throw err;
    }
  }, [userId]);

  // 検診を更新
  const updateCheckup = useCallback(async (id: string, updates: CheckupUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('checkups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCheckups((prev) =>
        prev.map((checkup) => (checkup.id === id ? data : checkup))
      );

      return data;
    } catch (err) {
      console.error('検診更新エラー:', err);
      throw err;
    }
  }, []);

  // 検診を削除
  const deleteCheckup = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('checkups')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCheckups((prev) => prev.filter((checkup) => checkup.id !== id));
    } catch (err) {
      console.error('検診削除エラー:', err);
      throw err;
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    if (userId) {
      fetchCheckups();
    }
  }, [fetchCheckups, userId]);

  return {
    checkups,
    loading,
    error,
    addCheckup,
    updateCheckup,
    deleteCheckup,
    refetch: fetchCheckups,
  };
};
