-- AI 使用量配额系统
-- 创建 AI 使用量记录表
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_tokens INT DEFAULT 0,
  used_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, used_date)
);

-- 创建配额表（可配置每日限额）
CREATE TABLE IF NOT EXISTS ai_quota (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_limit INT DEFAULT 50000,  -- 默认每日 50000 tokens
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加每日限额的默认值（对已有用户）
ALTER TABLE ai_quota ALTER COLUMN daily_limit SET DEFAULT 50000;

-- RLS 策略
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ai_quota"
  ON ai_quota FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can upsert own ai_usage"
  ON ai_usage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "System can upsert own ai_quota"
  ON ai_quota FOR ALL
  USING (auth.uid() = user_id);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, used_date);
CREATE INDEX IF NOT EXISTS idx_ai_quota_user ON ai_quota(user_id);
