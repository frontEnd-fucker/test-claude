-- Add increment_ai_usage function for atomic usage tracking
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
