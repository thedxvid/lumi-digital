-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro')),
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3, 6)),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create usage_limits table
CREATE TABLE public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro', 'free')),
  
  -- Daily limits
  creative_images_daily_limit INTEGER NOT NULL DEFAULT 0,
  creative_images_daily_used INTEGER NOT NULL DEFAULT 0,
  profile_analysis_daily_limit INTEGER NOT NULL DEFAULT 0,
  profile_analysis_daily_used INTEGER NOT NULL DEFAULT 0,
  
  -- Monthly limits
  creative_images_monthly_limit INTEGER NOT NULL DEFAULT 0,
  creative_images_monthly_used INTEGER NOT NULL DEFAULT 0,
  carousels_monthly_limit INTEGER NOT NULL DEFAULT 0,
  carousels_monthly_used INTEGER NOT NULL DEFAULT 0,
  videos_monthly_limit INTEGER NOT NULL DEFAULT 0,
  videos_monthly_used INTEGER NOT NULL DEFAULT 0,
  
  -- Video credits (from add-ons)
  video_credits INTEGER NOT NULL DEFAULT 0,
  video_credits_used INTEGER NOT NULL DEFAULT 0,
  
  -- Reset tracking
  last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_monthly_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on usage_limits
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Usage limits policies
CREATE POLICY "Users can view their own limits"
  ON public.usage_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own limits"
  ON public.usage_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all limits"
  ON public.usage_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage limits"
  ON public.usage_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create video_addons table
CREATE TABLE public.video_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('plus_10', 'plus_20', 'plus_30')),
  credits_amount INTEGER NOT NULL,
  price_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on video_addons
ALTER TABLE public.video_addons ENABLE ROW LEVEL SECURITY;

-- Video addons policies
CREATE POLICY "Users can view their own addons"
  ON public.video_addons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addons"
  ON public.video_addons FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage addons"
  ON public.video_addons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to initialize usage limits for new users
CREATE OR REPLACE FUNCTION public.initialize_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage_limits (
    user_id,
    plan_type,
    creative_images_daily_limit,
    profile_analysis_daily_limit,
    creative_images_monthly_limit,
    carousels_monthly_limit,
    videos_monthly_limit
  ) VALUES (
    NEW.id,
    'free',
    0,
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize limits when user is created
CREATE TRIGGER on_auth_user_created_init_limits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_usage_limits();

-- Create function to update subscription end date
CREATE OR REPLACE FUNCTION public.calculate_subscription_end_date(start_date TIMESTAMPTZ, duration_months INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN start_date + (duration_months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to reset daily limits
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    creative_images_daily_used = 0,
    profile_analysis_daily_used = 0,
    last_daily_reset = NOW()
  WHERE last_daily_reset < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly limits
CREATE OR REPLACE FUNCTION public.reset_monthly_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    creative_images_monthly_used = 0,
    carousels_monthly_used = 0,
    videos_monthly_used = 0,
    video_credits = 0,
    video_credits_used = 0,
    last_monthly_reset = NOW()
  WHERE last_monthly_reset < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(is_active);
CREATE INDEX idx_usage_limits_user_id ON public.usage_limits(user_id);
CREATE INDEX idx_video_addons_user_id ON public.video_addons(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();