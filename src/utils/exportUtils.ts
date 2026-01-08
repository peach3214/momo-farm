import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Log, Checkup } from '../types/database';

/**
 * ログデータをCSV形式に変換
 */
export const exportLogsToCSV = (logs: Log[]): string => {
  const headers = [
    '日時',
    '種類',
    '詳細',
    'メモ',
  ];

  const rows = logs.map(log => {
    const dateTime = format(new Date(log.logged_at), 'yyyy/MM/dd HH:mm', { locale: ja });
    const type = getLogTypeLabel(log.log_type);
    const details = getLogDetails(log);
    const memo = log.memo || '';

    return [dateTime, type, details, memo];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return '\uFEFF' + csvContent; // BOM付きUTF-8
};

/**
 * 検診データをCSV形式に変換
 */
export const exportCheckupsToCSV = (checkups: Checkup[]): string => {
  const headers = [
    '検診日',
    '検診名',
    '身長(cm)',
    '体重(kg)',
    '頭囲(cm)',
    '胸囲(cm)',
    '医師コメント',
    'まとめ',
  ];

  const rows = checkups.map(checkup => {
    const date = format(new Date(checkup.checkup_date), 'yyyy/MM/dd', { locale: ja });
    const name = checkup.custom_type_name || checkup.checkup_type;
    const height = checkup.height_cm?.toString() || '';
    const weight = checkup.weight_g ? (checkup.weight_g / 1000).toFixed(2) : '';
    const head = checkup.head_circumference_cm?.toString() || '';
    const chest = checkup.chest_circumference_cm?.toString() || '';
    const comments = checkup.doctor_comments || '';
    const summary = checkup.summary || '';

    return [date, name, height, weight, head, chest, comments, summary];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return '\uFEFF' + csvContent;
};

/**
 * CSVファイルをダウンロード
 */
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ヘルパー関数
const getLogTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    feeding: '授乳',
    sleep: '寝る',
    wake: '起きる',
    hold: '抱っこ',
    poop: 'うんち',
    pee: 'しっこ',
    temperature: '体温',
    measurement: '身長体重',
    baby_food: '離乳食',
    memo: 'メモ',
  };
  return labels[type] || type;
};

const getLogDetails = (log: Log): string => {
  switch (log.log_type) {
    case 'feeding':
      if (log.feeding_type === 'bottle') {
        return `ミルク ${log.feeding_amount_ml}ml`;
      }
      const left = log.feeding_duration_left_min ? `左${log.feeding_duration_left_min}分` : '';
      const right = log.feeding_duration_right_min ? `右${log.feeding_duration_right_min}分` : '';
      return [left, right].filter(Boolean).join(' / ');

    case 'sleep':
    case 'hold':
      if (log.start_time && log.end_time) {
        const start = format(new Date(log.start_time), 'HH:mm');
        const end = format(new Date(log.end_time), 'HH:mm');
        const duration = Math.floor((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000);
        return `${start}〜${end} (${duration}分)`;
      }
      return log.start_time ? format(new Date(log.start_time), 'HH:mm') + '〜' : '';

    case 'poop':
      const amount = log.poop_amount === 'small' ? '少量' : log.poop_amount === 'large' ? '多量' : '普通';
      return `${amount} / ${log.poop_color} / ${log.poop_consistency}`;

    case 'pee':
      return `${log.pee_count}回`;

    case 'temperature':
      return `${log.temperature_celsius}℃`;

    case 'measurement':
      const parts = [];
      if (log.height_cm) parts.push(`身長${log.height_cm}cm`);
      if (log.weight_g) parts.push(`体重${(log.weight_g / 1000).toFixed(2)}kg`);
      return parts.join(' / ');

    case 'baby_food':
      return `${log.baby_food_content} (${log.baby_food_amount})`;

    default:
      return '';
  }
};
