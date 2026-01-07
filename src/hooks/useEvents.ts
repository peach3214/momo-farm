import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Event, EventInsert, EventUpdate } from '../types/database';
import { startOfMonth, endOfMonth } from 'date-fns';

interface UseEventsOptions {
  month?: Date;
  enableRealtime?: boolean;
}

// 固定のテストユーザーID（認証なしで使用）
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// 現在のユーザーIDを取得
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useEvents = (options: UseEventsOptions = {}) => {
  const { month = new Date(), enableRealtime = true } = options;
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ユーザーIDを取得
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // 月の範囲を取得
  const getMonthRange = useCallback((targetMonth: Date) => {
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
    return { start, end };
  }, []);

  // イベントを取得
  const fetchEvents = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { start, end } = getMonthRange(month);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_date', start.toISOString().split('T')[0])
        .lte('event_date', end.toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('イベント取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [month, getMonthRange, userId]);

  // イベントを追加
  const addEvent = useCallback(async (eventData: Omit<EventInsert, 'user_id'>) => {
    if (!userId) {
      throw new Error('ユーザーIDが取得できません');
    }

    try {
      const newEvent: EventInsert = {
        ...eventData,
        user_id: userId,
      };

      const { data, error: insertError } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (insertError) throw insertError;

      setEvents((prev) => [...prev, data].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ));

      return data;
    } catch (err) {
      console.error('イベント追加エラー:', err);
      throw err;
    }
  }, [userId]);

  // イベントを更新
  const updateEvent = useCallback(async (id: string, updates: EventUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? data : event))
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      );

      return data;
    } catch (err) {
      console.error('イベント更新エラー:', err);
      throw err;
    }
  }, []);

  // イベントを削除
  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error('イベント削除エラー:', err);
      throw err;
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [fetchEvents, userId]);

  // リアルタイムサブスクリプション
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('イベントリアルタイム更新:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as Event;
            setEvents((prev) => {
              if (prev.some((event) => event.id === newEvent.id)) {
                return prev;
              }
              return [...prev, newEvent].sort(
                (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as Event;
            setEvents((prev) =>
              prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
                .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedEvent = payload.old as Event;
            setEvents((prev) => prev.filter((event) => event.id !== deletedEvent.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, enableRealtime, userId]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
