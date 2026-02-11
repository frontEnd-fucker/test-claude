-- Update project owner trigger to ensure owner role is always set correctly
-- Use DO UPDATE to ensure role is 'owner' even if record exists

CREATE OR REPLACE FUNCTION add_project_owner_to_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the project owner (NEW.user_id) to project_members table
  -- Use DO UPDATE to ensure role is always 'owner' and status is 'active'
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
  ON CONFLICT (project_id, user_id) DO UPDATE SET
    role = 'owner',
    status = 'active',
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION add_project_owner_to_members() IS 'Automatically adds or updates project owner in project_members table when a project is created, ensuring role is always owner';