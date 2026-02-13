-- Fix project_members RLS policies to allow project owners (from projects.user_id)
-- to manage members even if they are not yet in project_members table
-- This resolves the circular dependency issue when creating new projects

-- Update SELECT policy: Users can view members of projects they belong to
-- Allow users who are in project_members OR are the project owner in projects table
DROP POLICY IF EXISTS "Users can view members of projects they belong to" ON project_members;
CREATE POLICY IF NOT EXISTS "Users can view members of projects they belong to"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Update ALL policy: Project owners and admins can manage members
-- Allow users who are owner/admin in project_members OR are the project owner in projects table
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON project_members;
CREATE POLICY IF NOT EXISTS "Project owners and admins can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
    )
  );