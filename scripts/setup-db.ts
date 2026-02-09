#!/usr/bin/env node

/**
 * Database Setup Script for Vibe Coders Supabase Integration
 *
 * This script provides instructions for setting up the Supabase database.
 * Since we cannot automate Supabase setup without credentials, we provide
 * step-by-step instructions.
 */

console.log(`
=== 本地开发环境设置 ===

1. 安装必需工具：
   - 安装Docker Desktop: https://www.docker.com/products/docker-desktop
   - 安装Supabase CLI: npm install -g supabase 或 brew install supabase/tap/supabase

2. 启动本地Supabase服务：
   npm run supabase:start

3. 应用数据库schema和迁移：
   npm run supabase:reset

4. 启用实时订阅：
   - 本地Supabase Studio: http://localhost:54323
   - 在SQL编辑器中运行 supabase/seed.sql 中的命令

5. 启动开发服务器：
   npm run dev

6. 访问应用：
   http://localhost:3000

=== 云端生产环境设置 ===

1. 访问 https://supabase.com 创建新项目或使用现有项目

2. 获取Supabase凭证：
   - 进入 Project Settings > API
   - 复制 "Project URL" (NEXT_PUBLIC_SUPABASE_URL)
   - 复制 "anon public" key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - 复制 "service_role" key (SUPABASE_SERVICE_ROLE_KEY) - 保密！

3. 更新 .env.production 文件：
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

4. 设置数据库schema：
   - 在Supabase控制台的SQL编辑器中
   - 复制 lib/supabase/schema.sql 的内容
   - 粘贴并运行

5. 验证表已创建：
   - 进入 Table Editor
   - 应该看到：projects, tasks, todos, notes, comments, project_members 表

6. 生成TypeScript类型：
   npm run db:types

7. 测试连接：
   - 启动Next.js应用：npm run build && npm start
   - 访问 /auth/register 创建账户
   - 验证可以创建项目、任务、待办事项等

=== 故障排除 ===

- 如果遇到认证错误，验证环境变量
- 如果表未出现，检查SQL执行是否有错误
- 如果RLS策略阻止访问，验证是否已登录且策略正确
- 对于实时订阅，确保已启用表的复制

=== 本地开发优势 ===

✅ 离线开发 - 无需网络连接
✅ 数据隔离 - 开发数据不影响生产
✅ 快速迭代 - 无网络延迟
✅ 成本节约 - 不消耗云资源
✅ 调试方便 - 直接访问本地数据库

=== 环境切换 ===

开发环境自动使用本地Supabase (NODE_ENV=development)
生产环境自动使用云端Supabase (NODE_ENV=production)

=== 常用命令 ===

# 启动本地开发环境
npm run dev:local

# 停止本地服务
npm run supabase:stop

# 重置本地数据库
npm run supabase:reset

# 生成本地类型定义
npm run db:local:types

# 检查服务状态
npm run supabase:status
`)

// Check if .env.local exists
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✓ .env.local file exists')
} else {
  console.log('⚠ .env.local file not found - create one with Supabase credentials')
}

const schemaPath = path.join(__dirname, '..', 'lib', 'supabase', 'schema.sql')
if (fs.existsSync(schemaPath)) {
  console.log('✓ Database schema file exists:', schemaPath)
} else {
  console.log('⚠ Database schema file not found')
}