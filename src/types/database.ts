// ==========================================
// データベース型定義
// ==========================================

export interface Database {
  public: {
    Tables: {
      profiles: Profile;
      logs: Log;
      events: Event;
      checkups: Checkup;
    };
  };
}

// ==========================================
// Profile型
// ==========================================
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  child_name: string | null;
  child_birthday: string; // ISO 8601 date string
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  display_name?: string;
  child_name?: string;
  child_birthday: string;
}

export interface ProfileUpdate {
  display_name?: string;
  child_name?: string;
  child_birthday?: string;
}

// ==========================================
// Log型
// ==========================================
export type LogType =
  | 'feeding'
  | 'sleep'
  | 'wake'
  | 'hold'
  | 'poop'
  | 'pee'
  | 'temperature'
  | 'measurement'
  | 'baby_food'
  | 'memo';

export type FeedingType = 'breast_left' | 'breast_right' | 'bottle' | 'both';
export type PoopAmount = 'small' | 'medium' | 'large';
export type PoopConsistency = 'watery' | 'soft' | 'normal' | 'hard';
export type TemperatureLocation = 'armpit' | 'oral' | 'forehead' | 'ear';
export type BabyFoodAmount = 'all' | 'half' | 'little' | 'none';

export interface Log {
  id: string;
  user_id: string;
  log_type: LogType;
  logged_at: string;

  // 授乳
  feeding_type?: FeedingType;
  feeding_amount_ml?: number;
  feeding_duration_left_min?: number;
  feeding_duration_right_min?: number;

  // 睡眠・抱っこ
  start_time?: string;
  end_time?: string;

  // うんち
  poop_amount?: PoopAmount;
  poop_color?: string;
  poop_consistency?: PoopConsistency;

  // しっこ
  pee_count?: number;

  // 体温
  temperature_celsius?: number;
  temperature_location?: TemperatureLocation;

  // 身長体重
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;

  // 離乳食
  baby_food_content?: string;
  baby_food_amount?: BabyFoodAmount;

  // 共通
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface LogInsert {
  user_id: string;
  log_type: LogType;
  logged_at: string;
  feeding_type?: FeedingType;
  feeding_amount_ml?: number;
  feeding_duration_left_min?: number;
  feeding_duration_right_min?: number;
  start_time?: string;
  end_time?: string;
  poop_amount?: PoopAmount;
  poop_color?: string;
  poop_consistency?: PoopConsistency;
  pee_count?: number;
  temperature_celsius?: number;
  temperature_location?: TemperatureLocation;
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;
  baby_food_content?: string;
  baby_food_amount?: BabyFoodAmount;
  memo?: string;
}

export interface LogUpdate {
  log_type?: LogType;
  logged_at?: string;
  feeding_type?: FeedingType;
  feeding_amount_ml?: number;
  feeding_duration_left_min?: number;
  feeding_duration_right_min?: number;
  start_time?: string;
  end_time?: string;
  poop_amount?: PoopAmount;
  poop_color?: string;
  poop_consistency?: PoopConsistency;
  pee_count?: number;
  temperature_celsius?: number;
  temperature_location?: TemperatureLocation;
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;
  baby_food_content?: string;
  baby_food_amount?: BabyFoodAmount;
  memo?: string;
}

// ==========================================
// Event型
// ==========================================
export type EventCategory = 'vaccination' | 'checkup' | 'celebration' | 'other';

export interface Event {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  relative_days?: number;
  is_relative: boolean;
  category?: EventCategory;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  user_id: string;
  event_name: string;
  event_date: string;
  relative_days?: number;
  is_relative?: boolean;
  category?: EventCategory;
  memo?: string;
}

export interface EventUpdate {
  event_name?: string;
  event_date?: string;
  relative_days?: number;
  is_relative?: boolean;
  category?: EventCategory;
  memo?: string;
}

// ==========================================
// Checkup型
// ==========================================
export type CheckupType =
  | 'newborn_visit'
  | '1month'
  | '3month'
  | '6month'
  | '9month'
  | '12month'
  | '18month'
  | '36month'
  | 'custom';

export interface CheckupTask {
  text: string;
  completed: boolean;
}

export interface Checkup {
  id: string;
  user_id: string;
  checkup_date: string;
  checkup_type: CheckupType;
  custom_type_name?: string;

  // 身体測定
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;
  chest_circumference_cm?: number;

  // テキスト
  doctor_comments?: string;
  tasks?: CheckupTask[];
  next_time_notes?: string;
  summary?: string;

  // 画像
  image_urls?: string[];

  created_at: string;
  updated_at: string;
}

export interface CheckupInsert {
  user_id: string;
  checkup_date: string;
  checkup_type: CheckupType;
  custom_type_name?: string;
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;
  chest_circumference_cm?: number;
  doctor_comments?: string;
  tasks?: CheckupTask[];
  next_time_notes?: string;
  summary?: string;
  image_urls?: string[];
}

export interface CheckupUpdate {
  checkup_date?: string;
  checkup_type?: CheckupType;
  custom_type_name?: string;
  height_cm?: number;
  weight_g?: number;
  head_circumference_cm?: number;
  chest_circumference_cm?: number;
  doctor_comments?: string;
  tasks?: CheckupTask[];
  next_time_notes?: string;
  summary?: string;
  image_urls?: string[];
}
