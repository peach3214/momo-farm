import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

interface Outing {
  id: string;
  user_id: string;
  place_name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  notes: string | null;
  rating: number | null;
  is_favorite: boolean;
  created_at: string;
}

export const useOutings = () => {
  const [outings, setOutings] = useState<Outing[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || TEST_USER_ID;
  };

  const fetchOutings = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('outings')
        .select('*')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false });

      if (error) throw error;
      setOutings(data || []);
    } catch (error) {
      console.error('Error fetching outings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOuting = async (outing: Omit<Outing, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('outings')
        .insert([{ ...outing, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setOutings([data, ...outings]);
      }
    } catch (error) {
      console.error('Error adding outing:', error);
      throw error;
    }
  };

  const updateOuting = async (id: string, updates: Partial<Outing>) => {
    try {
      const { data, error } = await supabase
        .from('outings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setOutings(outings.map(o => o.id === id ? data : o));
      }
    } catch (error) {
      console.error('Error updating outing:', error);
      throw error;
    }
  };

  const deleteOuting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('outings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setOutings(outings.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting outing:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchOutings();
  }, []);

  return {
    outings,
    loading,
    addOuting,
    updateOuting,
    deleteOuting,
  };
};
