import { useEffect } from 'react';

// 通知パーミッションをリクエスト
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('このブラウザは通知に対応していません');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 通知を送信
export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  }
};

// 授乳リマインダー
export const useNursingReminder = (lastFeedingTime: Date | null, intervalHours: number = 3) => {
  useEffect(() => {
    if (!lastFeedingTime) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - lastFeedingTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= intervalHours) {
        sendNotification('授乳の時間です', {
          body: `前回の授乳から${Math.floor(diffHours)}時間が経過しました`,
          tag: 'nursing-reminder',
          requireInteraction: true,
        });
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(checkInterval);
  }, [lastFeedingTime, intervalHours]);
};

// タイマー完了通知
export const notifyTimerComplete = (activityName: string, duration: number) => {
  const minutes = Math.floor(duration / 60);
  sendNotification(`${activityName}完了`, {
    body: `${minutes}分経過しました`,
    tag: 'timer-complete',
  });
};

// カスタム通知フック
export const useCustomNotifications = () => {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const notify = (title: string, body: string, tag?: string) => {
    sendNotification(title, { body, tag });
  };

  return { notify };
};
