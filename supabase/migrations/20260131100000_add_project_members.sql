-- Add project members table for multi-user collaboration
-- This migration adds support for project members, roles, and permissions

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Add existing project owners as members
INSERT INTO project_members (project_id, user_id, role, status, joined_at)
SELECT id, user_id, 'owner', 'active', created_at
FROM projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of projects they belong to
CREATE POLICY "Users can view members of projects they belong to"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Policy: Project owners and admins can manage members
CREATE POLICY "Project owners and admins can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Update existing tables RLS policies to allow project members access

-- Update projects table policy to allow project members to view
DROP POLICY IF EXISTS "Users can access their own projects" ON projects;
CREATE POLICY "Users can access projects they belong to"
  ON projects FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Update tasks table policy to allow project members to access
DROP POLICY IF EXISTS "Users can access their own tasks" ON tasks;
CREATE POLICY "Users can access tasks in projects they belong to"
  ON tasks FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Update todos table policy to allow project members to access
DROP POLICY IF EXISTS "Users can access their own todos" ON todos;
CREATE POLICY "Users can access todos in projects they belong to"
  ON todos FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = todos.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Update notes table policy to allow project members to access
DROP POLICY IF EXISTS "Users can access their own notes" ON notes;
CREATE POLICY "Users can access notes in projects they belong to"
  ON notes FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = notes.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Add policy for users to view tasks assigned to them
CREATE POLICY "Users can view tasks assigned to them"
  ON tasks FOR SELECT
  USING (
    auth.uid() = assignee_id AND
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'active'
    )
  );