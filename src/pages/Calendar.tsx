import { useState } from 'react';
import { Plus } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useLogs } from '../hooks/useLogs';
import { useEvents } from '../hooks/useEvents';
import { useProfile } from '../hooks/useProfile';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { EventModal } from '../components/calendar/EventModal';
import { EventList } from '../components/calendar/EventList';
import type { EventInsert, Event } from '../types/database';

export const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // データ取得
  const { profile, childBirthday } = useProfile();
  
  // 月全体のログを取得
  const { logs: allLogs } = useLogs({ 
    date: currentMonth, 
    enableRealtime: true 
  });

  const { 
    events, 
    addEvent, 
    updateEvent, 
    deleteEvent 
  } = useEvents({ 
    month: currentMonth, 
    enableRealtime: true 
  });

  // カレンダーの日付クリック（シングルクリックで予定表示）
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // イベント追加
  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventModalOpen(true);
  };

  // イベント編集
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  // イベント保存
  const handleEventSubmit = async (data: Omit<EventInsert, 'user_id'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await addEvent(data);
    }
    setEventModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 sm:pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            カレンダー
          </h1>
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>予定追加</span>
          </button>
        </div>
      </header>

      {/* カレンダー */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <MonthCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={handleDateClick}
          selectedDate={selectedDate}
          logs={allLogs}
          events={events}
        />

        {/* 選択した日の予定リスト */}
        <EventList
          selectedDate={selectedDate}
          events={events}
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent}
        />
      </main>

      {/* イベント追加・編集モーダル */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleEventSubmit}
        childBirthday={childBirthday}
        initialData={editingEvent || undefined}
      />
    </div>
  );
};
