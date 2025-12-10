export type VideoMode = 'text-to-video' | 'image-to-video';

export interface VideoGenerationRequest {
  mode?: VideoMode;
  prompt: string;
  input_images?: string[];
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  duration?: '4s' | '6s' | '8s' | '10s';
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
  thumbnail_url?: string;
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
  mode: VideoMode;
  prompt: string;
  input_images?: string[];
  aspect_ratio: '9:16' | '16:9' | '1:1';
  duration: '4s' | '6s' | '8s' | '10s';
  resolution: '720p' | '1080p';
  generate_audio: boolean;
  negative_prompt?: string;
  enhance_prompt?: boolean;
  api_provider?: string;
}

export interface VideoAPIConfig {
  id: string;
  name: string;
  display_name: string;
  cost_per_8s: number;
  description: string;
  provider: string;
  mode: VideoMode;
  requires_images?: 1 | 2;
  endpoint?: string;
  requires_user_key?: boolean;
}
