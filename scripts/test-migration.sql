-- 项目参与者功能迁移测试脚本
-- 在Supabase SQL编辑器中运行此脚本以验证迁移

-- 1. 检查表结构
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'project_members'
ORDER BY ordinal_position;

-- 2. 检查索引
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'project_members';

-- 3. 检查RLS策略
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'project_members'
ORDER BY policyname;

-- 4. 检查现有项目的成员
SELECT
    p.name as project_name,
    p.user_id as project_owner_id,
    pm.user_id as member_id,
    pm.role,
    pm.status,
    pm.joined_at
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
ORDER BY p.created_at, pm.joined_at;

-- 5. 检查角色约束
SELECT
    conname,
    consrc
FROM pg_constraint
WHERE conname LIKE '%project_members_role_check%'
   OR conname LIKE '%project_members_status_check%';

-- 6. 测试数据插入（模拟添加新成员）
-- 注意：需要替换为实际的用户ID
/*
INSERT INTO project_members (project_id, user_id, role, invited_by)
VALUES (
    (SELECT id FROM projects LIMIT 1),
    '00000000-0000-0000-0000-000000000001', -- 替换为实际用户ID
    'member',
    (SELECT user_id FROM projects LIMIT 1)
)
ON CONFLICT (project_id, user_id) DO NOTHING
RETURNING *;
*/

-- 7. 验证唯一约束
-- 尝试插入重复记录应该失败
/*
INSERT INTO project_members (project_id, user_id, role)
SELECT
    (SELECT id FROM projects LIMIT 1),
    (SELECT user_id FROM projects LIMIT 1),
    'member'
WHERE NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = (SELECT id FROM projects LIMIT 1)
    AND user_id = (SELECT user_id FROM projects LIMIT 1)
);
*/

-- 8. 检查外键约束
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'project_members';