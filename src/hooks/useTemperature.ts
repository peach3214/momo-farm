import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

interface TemperatureTerm {
  id: string;
  user_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

interface TemperatureRecord {
  id: string;
  term_id: string;
  temperature: number;
  measured_at: string;
  condition: string;
  symptoms: string | null;
  medication: string | null;
  notes: string | null;
  created_at: string;
}

export const useTemperature = () => {
  const [terms, setTerms] = useState<TemperatureTerm[]>([]);
  const [records, setRecords] = useState<TemperatureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || TEST_USER_ID;
  };

  const fetchTerms = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('temperature_terms')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('temperature_records')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTerm = async (term: Omit<TemperatureTerm, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('temperature_terms')
        .insert([{ ...term, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTerms([data, ...terms]);
        return data;
      }
    } catch (error) {
      console.error('Error adding term:', error);
      throw error;
    }
  };

  const updateTerm = async (id: string, updates: Partial<TemperatureTerm>) => {
    try {
      const { data, error } = await supabase
        .from('temperature_terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTerms(terms.map(t => t.id === id ? data : t));
      }
    } catch (error) {
      console.error('Error updating term:', error);
      throw error;
    }
  };

  const deleteTerm = async (id: string) => {
    try {
      // 関連する記録も削除
      await supabase
        .from('temperature_records')
        .delete()
        .eq('term_id', id);

      const { error } = await supabase
        .from('temperature_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTerms(terms.filter(t => t.id !== id));
      setRecords(records.filter(r => r.term_id !== id));
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  };

  const addRecord = async (record: Omit<TemperatureRecord, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('temperature_records')
        .insert([{ ...record, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setRecords([data, ...records]);
      }
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  };

  const updateRecord = async (id: string, updates: Partial<TemperatureRecord>) => {
    try {
      const { data, error } = await supabase
        .from('temperature_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setRecords(records.map(r => r.id === id ? data : r));
      }
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('temperature_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(records.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  };

  useEffect(() => {
    Promise.all([fetchTerms(), fetchRecords()]);
  }, []);

  return {
    terms,
    records,
    loading,
    addTerm,
    updateTerm,
    deleteTerm,
    addRecord,
    updateRecord,
    deleteRecord,
  };
};
