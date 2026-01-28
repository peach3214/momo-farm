import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  difficulty: number;
  prerequisite_id: string | null;
  is_unlocked: boolean;
  unlocked_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('achievements')
        .insert([{ ...achievement, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAchievements([...achievements, data]);
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  };

  const unlockAchievement = async (id: string) => {
    try {
      const { data, error} = await supabase
        .from('achievements')
        .update({
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAchievements(achievements.map(a => a.id === id ? data : a));
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  };

  const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAchievements(achievements.map(a => a.id === id ? data : a));
      }
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  };

  const deleteAchievement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAchievements(achievements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  };

  const getStats = () => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.is_unlocked).length;
    const completionRate = total > 0 ? (unlocked / total) * 100 : 0;

    return {
      total,
      unlocked,
      locked: total - unlocked,
      completionRate: Math.round(completionRate),
    };
  };

  const canUnlock = (achievement: Achievement) => {
    if (achievement.is_unlocked) return false;
    if (!achievement.prerequisite_id) return true;
    
    const prerequisite = achievements.find(a => a.id === achievement.prerequisite_id);
    return prerequisite?.is_unlocked === true;
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return {
    achievements,
    loading,
    addAchievement,
    unlockAchievement,
    updateAchievement,
    deleteAchievement,
    getStats,
    canUnlock,
  };
};
