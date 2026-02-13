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

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own projects
CREATE POLICY IF NOT EXISTS "Users can access their own projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own tasks
CREATE POLICY IF NOT EXISTS "Users can access their own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own todos
CREATE POLICY IF NOT EXISTS "Users can access their own todos"
  ON todos FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own notes
CREATE POLICY IF NOT EXISTS "Users can access their own notes"
  ON notes FOR ALL USING (auth.uid() = user_id);

-- Optional: Allow users to view tasks assigned to them even if not owner
-- CREATE POLICY "Users can view tasks assigned to them"
--   ON tasks FOR SELECT USING (auth.uid() = assignee_id);