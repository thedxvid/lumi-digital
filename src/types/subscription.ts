export type PlanType = 'free' | 'basic' | 'lumi';
export type DurationMonths = 1 | 3 | 6 | 12;
export type ApiTier = 'standard' | 'pro';
export type VideoAddonType = 
  | 'plus_10' 
  | 'plus_20' 
  | 'plus_30'
  | 'advanced_5'
  | 'advanced_10'
  | 'advanced_15';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  duration_months: DurationMonths;
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  id: string;
  user_id: string;
  plan_type: PlanType;
  api_tier?: ApiTier;
  creative_images_daily_limit: number;
  creative_images_daily_used: number;
  profile_analysis_daily_limit: number;
  profile_analysis_daily_used: number;
  creative_images_monthly_limit: number;
  creative_images_monthly_used: number;
  carousels_monthly_limit: number;
  carousels_monthly_used: number;
  carousel_images_monthly_limit?: number;
  carousel_images_monthly_used?: number;
  videos_monthly_limit: number;
  videos_monthly_used: number;
  video_credits: number;
  video_credits_used: number;
  sora_text_videos_lifetime_limit: number;
  sora_text_videos_lifetime_used: number;
  kling_image_videos_lifetime_limit: number;
  kling_image_videos_lifetime_used: number;
  last_daily_reset: string;
  last_monthly_reset: string;
  created_at: string;
  updated_at: string;
}

export interface VideoAddon {
  id: string;
  user_id: string;
  package_type: VideoAddonType;
  credits_amount: number;
  price_paid: number;
  stripe_payment_id?: string;
  purchased_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface PlanConfig {
  type: PlanType;
  name: string;
  description: string;
  prices: {
    1: number;
    3: number;
    6: number;
  };
  features: string[];
  limits: {
    creativeDailyImages: number;
    creativeMonthlyImages: number;
    profileDailyAnalysis: number;
    monthlyCarousels: number;
    monthlyVideos: number;
  };
}

export interface VideoAddonConfig {
  type: VideoAddonType;
  credits: number;
  price: number;
  name: string;
  planType: 'basic';
  description?: string;
}
