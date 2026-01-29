# 测试用户设置指南

## 问题
E2E测试需要有效的测试用户凭据才能登录。

## 解决方案

### 1. 创建测试用户
在Supabase中创建一个测试用户：

1. **通过应用注册页面**：
   - 启动应用：`npm run dev`
   - 访问 `http://localhost:3000/auth/register`
   - 注册一个新用户（例如：`test@example.com` / `TestPassword123`）
   - 记下邮箱和密码

2. **通过Supabase Dashboard**：
   - 登录到你的Supabase项目
   - 进入 **Authentication** > **Users**
   - 点击 **"Add User"**
   - 填写邮箱和密码
   - 点击 **"Create User"**

3. **使用Supabase CLI**（高级）：
   ```bash
   # 安装Supabase CLI
   npm install supabase --save-dev

   # 创建用户（需要service_role key）
   npx supabase auth admin create-user --email test@example.com --password TestPassword123
   ```

### 2. 配置环境变量
编辑 `.env.local` 文件，添加测试用户凭据：

```bash
# 在文件末尾添加
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123
```

### 3. 验证测试用户
运行以下命令验证测试用户是否可以登录：

```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行快速测试
npx playwright test e2e/create-project-pom.spec.ts --headed --timeout=60000
```

## 故障排除

### 登录失败常见原因：
1. **用户不存在**：在Supabase中创建用户
2. **密码错误**：使用正确的密码
3. **邮箱未验证**：在Supabase Dashboard中验证用户邮箱
4. **网络问题**：确保应用可以访问Supabase
5. **环境变量未加载**：重启Playwright测试

### 检查步骤：
1. **手动登录测试**：
   - 访问 `http://localhost:3000/auth/login`
   - 使用测试用户凭据登录
   - 如果能成功登录，说明用户有效

2. **检查环境变量**：
   ```bash
   # 检查环境变量是否被加载
   node -e "console.log('TEST_USER_EMAIL:', process.env.TEST_USER_EMAIL)"
   ```

3. **检查Supabase连接**：
   - 确保 `.env.local` 中的Supabase配置正确
   - 确保NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY有效

## 自动化方案（可选）

### 创建测试用户脚本
创建 `scripts/create-test-user.ts`：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'TestPassword123',
    email_confirm: true,
  });

  if (error) {
    console.error('创建测试用户失败:', error);
  } else {
    console.log('测试用户创建成功:', data.user?.email);
  }
}

createTestUser();
```

运行脚本：
```bash
tsx scripts/create-test-user.ts
```

## 安全注意事项

1. **不要使用生产用户**：始终使用专门的测试用户
2. **使用强密码**：即使测试用户也应使用强密码
3. **定期清理**：定期清理测试用户数据
4. **不要提交敏感信息**：确保.env.local在.gitignore中

## 下一步

1. ✅ 创建测试用户
2. ✅ 配置环境变量
3. ✅ 运行E2E测试
4. ✅ 调试登录问题

如果问题仍然存在，请检查：
- Playwright测试日志
- 浏览器开发者工具控制台
- Supabase认证日志
- 应用服务器日志