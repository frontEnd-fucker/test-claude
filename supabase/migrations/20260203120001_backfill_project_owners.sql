-- Backfill missing owner records in project_members table
-- For projects where the owner (projects.user_id) is not in project_members table
-- This ensures data consistency after fixing the createProject function

INSERT INTO project_members (project_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT
  p.id as project_id,
  p.user_id,
  'owner' as role,
  'active' as status,
  p.created_at as joined_at,
  NOW() as created_at,
  NOW() as updated_at
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm
  WHERE pm.project_id = p.id
  AND pm.user_id = p.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;