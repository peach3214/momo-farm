import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Log, LogInsert, LogUpdate } from '../types/database';

interface UseLogsOptions {
  date?: Date;
  enableRealtime?: boolean;
}

// テスト用のユーザーID（開発環境用）
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// 現在のユーザーIDを取得（認証済みなら実際のID、未認証ならテストID）
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useLogs = (options: UseLogsOptions = {}) => {
  const { date = new Date(), enableRealtime = true } = options;
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ユーザーIDを取得
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // 日付の開始・終了時刻を取得（JST）
  const getDateRange = useCallback((targetDate: Date) => {
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, []);

  // 記録を取得
  const fetchLogs = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange(date);

      const { data, error: fetchError } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: true }); // 古い順（時系列順）

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('記録取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [date, getDateRange, userId]);

  // 記録を追加
  const addLog = useCallback(async (logData: Omit<LogInsert, 'user_id'>) => {
    if (!userId) {
      throw new Error('ユーザーIDが取得できません');
    }

    try {
      const newLog: LogInsert = {
        ...logData,
        user_id: userId,
      };

      const { data, error: insertError } = await supabase
        .from('logs')
        .insert(newLog)
        .select()
        .single();

      if (insertError) throw insertError;

      // 楽観的UI更新（時系列順を保つ）
      setLogs((prev) => [...prev, data].sort(
        (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
      ));

      return data;
    } catch (err) {
      console.error('記録追加エラー:', err);
      throw err;
    }
  }, [userId]);

  // 記録を更新
  const updateLog = useCallback(async (id: string, updates: LogUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // UIを更新（時系列順を保つ）
      setLogs((prev) =>
        prev.map((log) => (log.id === id ? data : log))
          .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      );

      return data;
    } catch (err) {
      console.error('記録更新エラー:', err);
      throw err;
    }
  }, []);

  // 記録を削除
  const deleteLog = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('logs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // UIから削除
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err) {
      console.error('記録削除エラー:', err);
      throw err;
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    if (userId) {
      fetchLogs();
    }
  }, [fetchLogs, userId]);

  // リアルタイムサブスクリプション
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    const channel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('リアルタイム更新:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as Log;
            // 同じ日付の記録のみ追加
            const logDate = new Date(newLog.logged_at);
            if (logDate.toDateString() === date.toDateString()) {
              setLogs((prev) => {
                // 重複チェック
                if (prev.some((log) => log.id === newLog.id)) {
                  return prev;
                }
                return [...prev, newLog].sort(
                  (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLog = payload.new as Log;
            setLogs((prev) =>
              prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
                .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedLog = payload.old as Log;
            setLogs((prev) => prev.filter((log) => log.id !== deletedLog.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, enableRealtime, userId]);

  // 集計データを計算
  const summary = {
    feeding: logs.filter(log => log.log_type === 'feeding').length,
    poop: logs.filter(log => log.log_type === 'poop').length,
    pee: logs.reduce((sum, log) => sum + (log.log_type === 'pee' ? (log.pee_count || 0) : 0), 0),
  };

  return {
    logs,
    loading,
    error,
    summary,
    addLog,
    updateLog,
    deleteLog,
    refetch: fetchLogs,
  };
};
