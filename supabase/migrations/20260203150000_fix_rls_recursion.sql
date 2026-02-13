-- Fix RLS infinite recursion issue for project_members table
-- Create functions to check permissions without self-referencing RLS policies

-- Function to check if user can view project members
CREATE OR REPLACE FUNCTION can_view_project_members(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- User can view members if they are in project_members OR are the project owner
  SELECT COALESCE(
    project_uuid IS NOT NULL
    AND user_uuid IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_uuid
          AND pm.user_id = user_uuid
          AND pm.status = 'active'
      )
      OR
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_uuid
          AND p.user_id = user_uuid
      )
    ),
    FALSE
  );
$$;

-- Function to check if user can manage project members (owner or admin)
CREATE OR REPLACE FUNCTION can_manage_project_members(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- User can manage members if they are owner/admin in project_members OR are the project owner
  SELECT COALESCE(
    project_uuid IS NOT NULL
    AND user_uuid IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_uuid
          AND pm.user_id = user_uuid
          AND pm.status = 'active'
          AND pm.role IN ('owner', 'admin')
      )
      OR
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_uuid
          AND p.user_id = user_uuid
      )
    ),
    FALSE
  );
$$;

-- Function to check if user is an active member of a project
CREATE OR REPLACE FUNCTION is_project_member(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Check if user is an active member of the project
  SELECT COALESCE(
    project_uuid IS NOT NULL
    AND user_uuid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_uuid
        AND pm.user_id = user_uuid
        AND pm.status = 'active'
    ),
    FALSE
  );
$$;

-- Update project_members RLS policies to use the functions
DROP POLICY IF EXISTS "Users can view members of projects they belong to" ON project_members;
CREATE POLICY IF NOT EXISTS "Users can view members of projects they belong to"
  ON project_members FOR SELECT
  USING (can_view_project_members(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project owners and admins can manage members" ON project_members;
CREATE POLICY IF NOT EXISTS "Project owners and admins can manage members"
  ON project_members FOR ALL
  USING (can_manage_project_members(project_id, auth.uid()))
  WITH CHECK (can_manage_project_members(project_id, auth.uid()));

-- Update projects table RLS policy to use function (ensure consistency)
DROP POLICY IF EXISTS "Users can access projects they belong to" ON projects;
CREATE POLICY IF NOT EXISTS "Users can access projects they belong to"
  ON projects FOR ALL
  USING (
    auth.uid() = user_id OR
    is_project_member(id, auth.uid())
  );