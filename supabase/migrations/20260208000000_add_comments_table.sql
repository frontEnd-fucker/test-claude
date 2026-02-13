-- Add comments table for task and project discussions
-- Supports threaded comments with parent_id for replies

CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,

  -- Associate with either task or project (mutually exclusive)
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,

  -- Ensure only one association is set
  CONSTRAINT comment_target_check CHECK (
    (task_id IS NOT NULL AND project_id IS NULL) OR
    (task_id IS NULL AND project_id IS NOT NULL)
  ),

  -- Reply functionality
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,

  -- User information
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing comments: project members can view comments
DROP POLICY IF EXISTS "Project members can view comments" ON comments;
CREATE POLICY "Project members can view comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = COALESCE(
        comments.project_id,
        (SELECT project_id FROM tasks WHERE id = comments.task_id)
      )
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Policy for creating comments: owner/admin/member can create, viewer cannot
DROP POLICY IF EXISTS "Project members can create comments" ON comments;
CREATE POLICY "Project members can create comments" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = COALESCE(
        comments.project_id,
        (SELECT project_id FROM tasks WHERE id = comments.task_id)
      )
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

-- Policy for updating comments: users can only update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- Policy for deleting comments: comment author or project admin/owner can delete
DROP POLICY IF EXISTS "Comment author or project admin can delete comments" ON comments;
CREATE POLICY "Comment author or project admin can delete comments" ON comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = COALESCE(
        comments.project_id,
        (SELECT project_id FROM tasks WHERE id = comments.task_id)
      )
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();