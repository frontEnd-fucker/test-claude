-- AI Usage Quota System
-- Create AI usage record table
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_tokens INT DEFAULT 0,
  used_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, used_date)
);

-- Create quota table (configurable daily limit)
CREATE TABLE IF NOT EXISTS ai_quota (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_limit INT DEFAULT 50000,  -- Default 50000 tokens per day
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add default value for existing users
ALTER TABLE ai_quota ALTER COLUMN daily_limit SET DEFAULT 50000;

-- Create function for atomic usage increment (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id UUID,
  p_tokens INT,
  p_date DATE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage (user_id, used_tokens, used_date, created_at, updated_at)
  VALUES (p_user_id, p_tokens, p_date, NOW(), NOW())
  ON CONFLICT (user_id, used_date)
  DO UPDATE SET
    used_tokens = ai_usage.used_tokens + EXCLUDED.used_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own ai_quota"
  ON ai_quota FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can manage own ai_usage"
  ON ai_usage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can manage own ai_quota"
  ON ai_quota FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, used_date);
CREATE INDEX IF NOT EXISTS idx_ai_quota_user ON ai_quota(user_id);
