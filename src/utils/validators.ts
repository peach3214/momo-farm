import { z } from 'zod';

/**
 * 共通バリデーション
 */
export const baseLogSchema = z.object({
  logged_at: z.date(),
  memo: z.string().optional(),
});

/**
 * 授乳のバリデーション
 */
export const feedingSchema = baseLogSchema.extend({
  feeding_type: z.enum(['breast_left', 'breast_right', 'bottle', 'both']),
  feeding_amount_ml: z.number().min(0).max(500).optional(),
  feeding_duration_left_min: z.number().min(0).max(180).optional(),
  feeding_duration_right_min: z.number().min(0).max(180).optional(),
});

/**
 * 睡眠・抱っこのバリデーション
 */
export const durationSchema = baseLogSchema.extend({
  start_time: z.date(),
  end_time: z.date().optional(),
});

/**
 * うんちのバリデーション
 */
export const poopSchema = baseLogSchema.extend({
  poop_amount: z.enum(['small', 'medium', 'large']).optional(),
  poop_color: z.string().optional(),
  poop_consistency: z.enum(['watery', 'soft', 'normal', 'hard']).optional(),
});

/**
 * しっこのバリデーション
 */
export const peeSchema = baseLogSchema.extend({
  pee_count: z.number().min(1).max(20),
});

/**
 * 体温のバリデーション
 */
export const temperatureSchema = baseLogSchema.extend({
  temperature_celsius: z.number().min(30).max(45),
  temperature_location: z
    .enum(['armpit', 'oral', 'forehead', 'ear'])
    .optional(),
});

/**
 * 身長体重のバリデーション
 */
export const measurementSchema = baseLogSchema.extend({
  height_cm: z.number().min(0).max(200).optional(),
  weight_g: z.number().min(0).max(50000).optional(),
  head_circumference_cm: z.number().min(0).max(100).optional(),
});

/**
 * 離乳食のバリデーション
 */
export const babyFoodSchema = baseLogSchema.extend({
  baby_food_content: z.string().optional(),
  baby_food_amount: z.enum(['all', 'half', 'little', 'none']).optional(),
});

/**
 * メモのバリデーション
 */
export const memoSchema = baseLogSchema.extend({
  memo: z.string().min(1, '内容を入力してください'),
});

/**
 * 数値の範囲チェック
 */
export const validateNumber = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * 日時の妥当性チェック
 */
export const validateDateTime = (date: Date): boolean => {
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // 過去1年以内、かつ未来でない
  return date >= oneYearAgo && date <= now;
};

/**
 * 終了時刻が開始時刻より後かチェック
 */
export const validateEndTimeAfterStart = (
  startTime: Date,
  endTime: Date
): boolean => {
  return endTime > startTime;
};

/**
 * 継続時間が妥当かチェック（24時間以内）
 */
export const validateDuration = (startTime: Date, endTime: Date): boolean => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24;
};
