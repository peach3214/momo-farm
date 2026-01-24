import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

interface DiaperStock {
  id: string;
  user_id: string;
  count: number;
  updated_at: string;
}

export const useDiapers = () => {
  const [diapers, setDiapers] = useState<DiaperStock | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || TEST_USER_ID;
  };

  const fetchDiapers = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('diaper_stock')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setDiapers(data);
        setTotalCount(data.count);
      } else {
        // 初期データがない場合は作成
        const { data: newData, error: insertError } = await supabase
          .from('diaper_stock')
          .insert([{ user_id: userId, count: 0 }])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newData) {
          setDiapers(newData);
          setTotalCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching diapers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDiapers = async (count: number) => {
    try {
      const userId = await getUserId();
      const newCount = totalCount + count;

      if (diapers) {
        const { data, error } = await supabase
          .from('diaper_stock')
          .update({ count: newCount })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setDiapers(data);
          setTotalCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error adding diapers:', error);
      throw error;
    }
  };

  const useDiaper = async () => {
    try {
      const userId = await getUserId();
      const newCount = Math.max(0, totalCount - 1);

      if (diapers) {
        const { data, error } = await supabase
          .from('diaper_stock')
          .update({ count: newCount })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setDiapers(data);
          setTotalCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error using diaper:', error);
      throw error;
    }
  };

  const setCount = async (count: number) => {
    try {
      const userId = await getUserId();

      if (diapers) {
        const { data, error } = await supabase
          .from('diaper_stock')
          .update({ count })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setDiapers(data);
          setTotalCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error setting diaper count:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchDiapers();
  }, []);

  return {
    diapers,
    totalCount,
    loading,
    addDiapers,
    useDiaper,
    setCount,
  };
};
