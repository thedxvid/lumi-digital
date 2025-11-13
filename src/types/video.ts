export interface VideoGenerationRequest {
  prompt: string;
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  duration?: '4s' | '6s' | '8s';
  resolution?: '720p' | '1080p';
  generate_audio?: boolean;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  seed?: number;
  auto_fix?: boolean;
}

export interface VideoGenerationResponse {
  video: {
    url: string;
  };
  error?: string;
}

export interface VideoHistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  video_url: string;
  aspect_ratio?: string;
  duration?: string;
  resolution?: string;
  has_audio?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  api_used?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoConfig {
  prompt: string;
  aspect_ratio: '9:16' | '16:9' | '1:1';
  duration: '4s' | '6s' | '8s';
  resolution: '720p' | '1080p';
  generate_audio: boolean;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  api_provider?: 'fal_veo31' | 'fal_hunyuan' | 'fal_veo3_fast' | 'fal_wan_fast';
}

export interface VideoAPIConfig {
  id: string;
  name: string;
  display_name: string;
  cost_per_8s: number;
  description: string;
  provider: string;
}
