-- Add database trigger to automatically add project owner to project_members table
-- This ensures data consistency between projects and project_members tables
-- Runs AFTER INSERT on projects table

-- Create function to add owner to project_members
CREATE OR REPLACE FUNCTION add_project_owner_to_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the project owner (NEW.user_id) to project_members table
  INSERT INTO project_members (
    project_id,
    user_id,
    role,
    status,
    joined_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'owner',
    'active',
    NEW.created_at,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add owner when project is created
DROP TRIGGER IF EXISTS add_project_owner_trigger ON projects;
CREATE TRIGGER add_project_owner_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_to_members();

-- Comment for documentation
COMMENT ON FUNCTION add_project_owner_to_members() IS 'Automatically adds project owner to project_members table when a project is created';
COMMENT ON TRIGGER add_project_owner_trigger ON projects IS 'Trigger to ensure project owners are added to members table after project creation';