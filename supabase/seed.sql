-- 启用实时订阅所需的表复制
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE project_members;

-- 可选：添加测试数据
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', '{"name": "Test User"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 创建对应的用户资料
INSERT INTO public.profiles (id, email, name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test User', now(), now())
ON CONFLICT (id) DO NOTHING;