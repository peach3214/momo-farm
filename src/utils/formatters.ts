import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * UTC時刻をJSTに変換
 */
export const toJST = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  // UTCからJST（+9時間）に変換
  return new Date(d.getTime() + (9 * 60 * 60 * 1000));
};

/**
 * 日時を「HH:mm」形式でフォーマット（JST）
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: ja });
};

/**
 * 日時を「yyyy年M月d日」形式でフォーマット
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy年M月d日', { locale: ja });
};

/**
 * 日時を「M月d日 (E) HH:mm」形式でフォーマット
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M月d日 (E) HH:mm', { locale: ja });
};

/**
 * 相対時間を表示（例: 2時間前）
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ja });
};

/**
 * 継続時間を計算（分単位）
 */
export const calculateDuration = (
  start: Date | string,
  end: Date | string
): number => {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return differenceInMinutes(endDate, startDate);
};

/**
 * 継続時間を「◯時間◯分」形式でフォーマット
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`;
  } else if (hours > 0) {
    return `${hours}時間`;
  } else {
    return `${mins}分`;
  }
};

/**
 * 体重を「◯.◯kg」形式でフォーマット
 */
export const formatWeight = (grams: number): string => {
  const kg = grams / 1000;
  return `${kg.toFixed(2)}kg`;
};

/**
 * 身長を「◯◯.◯cm」形式でフォーマット
 */
export const formatHeight = (cm: number): string => {
  return `${cm.toFixed(1)}cm`;
};

/**
 * 体温を「◯◯.◯℃」形式でフォーマット
 */
export const formatTemperature = (celsius: number): string => {
  return `${celsius.toFixed(1)}℃`;
};

/**
 * 授乳時間をフォーマット
 */
export const formatFeedingDuration = (
  leftMin?: number,
  rightMin?: number
): string => {
  const parts = [];
  if (leftMin && leftMin > 0) {
    parts.push(`左${leftMin}分`);
  }
  if (rightMin && rightMin > 0) {
    parts.push(`右${rightMin}分`);
  }
  return parts.join(' ');
};

/**
 * ミルクの量をフォーマット
 */
export const formatBottleAmount = (ml: number): string => {
  return `${ml}ml`;
};
