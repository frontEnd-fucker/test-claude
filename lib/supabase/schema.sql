-- Supabase Database Schema for Vibe Coders Project Management App
-- This schema should be executed in Supabase SQL Editor

-- Note: users table is automatically created by Supabase Auth

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('todo', 'in-progress', 'complete')),
  priority text CHECK (priority IN ('low', 'medium', 'high')),
  position integer DEFAULT 0,
  due_date timestamptz,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- todos table
CREATE TABLE IF NOT EXISTS todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  completed boolean DEFAULT false,
  position integer DEFAULT 0,
  due_date timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- comments table for task and project discussions
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_project_id_idx ON todos(project_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON todos(completed);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_project_id_idx ON notes(project_id);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own projects
CREATE POLICY "Users can access their own projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own tasks
CREATE POLICY "Users can access their own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own todos
CREATE POLICY "Users can access their own todos"
  ON todos FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own notes
CREATE POLICY "Users can access their own notes"
  ON notes FOR ALL USING (auth.uid() = user_id);

-- Comments policies
-- Project members can view comments
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

-- Project members can create comments (owner/admin/member only, not viewer)
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

-- Users can only update their own comments
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- Comment author or project admin/owner can delete comments
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

-- Optional: Allow users to view tasks assigned to them even if not owner
-- CREATE POLICY "Users can view tasks assigned to them"
--   ON tasks FOR SELECT USING (auth.uid() = assignee_id);

-- Function to update updated_at timestamp for comments
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();