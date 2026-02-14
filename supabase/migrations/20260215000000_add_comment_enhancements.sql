-- 添加 mention_ids 字段到 comments 表
ALTER TABLE comments ADD COLUMN IF NOT EXISTS mention_ids uuid[] DEFAULT '{}';

-- 添加 comments_count 字段到 tasks 和 projects 表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comments_count int DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS comments_count int DEFAULT 0;

-- 创建更新 comments_count 的函数
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_id := COALESCE(NEW.task_id, NEW.project_id);
    IF NEW.task_id IS NOT NULL THEN
      UPDATE tasks SET comments_count = comments_count + 1 WHERE id = target_id;
    ELSE
      UPDATE projects SET comments_count = comments_count + 1 WHERE id = target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    target_id := COALESCE(OLD.task_id, OLD.project_id);
    IF OLD.task_id IS NOT NULL THEN
      UPDATE tasks SET comments_count = comments_count - 1 WHERE id = target_id;
    ELSE
      UPDATE projects SET comments_count = comments_count - 1 WHERE id = target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();
