# 测试成员邮箱配置指南

## 概述

任务分配功能的E2E测试需要至少两个测试用户账号：
1. **主测试用户** - 用于登录和创建项目（已配置为 `TEST_USER_EMAIL`）
2. **测试成员用户** - 作为项目成员添加到项目中（需要配置为 `TEST_MEMBER_EMAIL`）

## 配置步骤

### 1. 创建第二个测试用户账号

在您的Supabase项目中，创建第二个测试用户账号：

1. 访问您的Supabase项目仪表板
2. 导航到 **Authentication** → **Users**
3. 点击 **"Invite User"** 或 **"Create User"**
4. 填写以下信息：
   - **Email**: 选择一个测试邮箱（如 `test.member@example.com`）
   - **Password**: 设置一个密码（如 `password123`）
   - 其他字段可以留空

### 2. 配置环境变量

编辑 `e2e/.env` 文件，添加 `TEST_MEMBER_EMAIL` 环境变量：

```bash
# 测试用户凭据
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123

# 测试成员邮箱（用于任务分配测试）
TEST_MEMBER_EMAIL=test.member@example.com

# 其他配置保持不变...
```

### 3. 验证配置

运行以下命令验证配置：

```bash
# 检查环境变量是否加载
node -e "console.log('TEST_MEMBER_EMAIL:', process.env.TEST_MEMBER_EMAIL)"

# 运行任务分配测试
npx playwright test e2e/specs/task-assignment.spec.ts
```

## 测试场景说明

### 需要测试成员邮箱的测试

以下测试场景需要 `TEST_MEMBER_EMAIL`：

1. **基本分配测试** - 将任务分配给项目成员
2. **取消分配测试** - 将已分配的任务设置为未分配
3. **重新分配测试** - 在不同成员之间切换分配
4. **分配状态持久化测试** - 验证分配状态在页面导航后保持不变

### 不需要测试成员邮箱的测试

以下测试场景不需要 `TEST_MEMBER_EMAIL`：

1. **加载状态测试** - 验证分配器加载行为
2. **无成员情况测试** - 验证没有项目成员时的行为

## 故障排除

### 问题1: 测试成员邮箱未配置

**症状**: 测试跳过或失败，控制台显示警告信息

**解决方案**:
1. 确保 `e2e/.env` 文件中已设置 `TEST_MEMBER_EMAIL`
2. 确保该邮箱对应的用户已在Supabase中创建
3. 重启测试运行器以加载新的环境变量

### 问题2: 测试成员添加失败

**症状**: 测试在添加成员步骤失败

**解决方案**:
1. 验证测试成员邮箱格式正确
2. 确保测试成员用户已激活（未在Supabase中被禁用）
3. 检查网络连接和Supabase项目配置

### 问题3: 成员不在分配列表中

**症状**: 测试在分配任务时找不到成员

**解决方案**:
1. 确保成员已成功添加到项目中
2. 等待成员数据同步（可能需要几秒钟）
3. 刷新页面后重试

## 备选方案

如果无法配置第二个测试用户，可以：

### 方案A: 修改测试使用当前用户

修改测试代码，使用当前登录用户作为测试成员：

```typescript
// 在测试中获取当前用户邮箱
const currentUserEmail = process.env.TEST_USER_EMAIL;
```

### 方案B: 使用模拟数据

修改测试使用模拟的成员数据，不实际添加成员。

### 方案C: 仅运行不需要第二个用户的测试

运行特定测试：

```bash
# 仅运行加载状态测试
npx playwright test e2e/specs/task-assignment.spec.ts --grep "加载状态测试"

# 仅运行无成员情况测试
npx playwright test e2e/specs/task-assignment.spec.ts --grep "无成员情况测试"
```

## 最佳实践

1. **使用专用测试邮箱** - 避免使用生产邮箱
2. **定期清理测试数据** - 测试后删除创建的项目
3. **隔离测试环境** - 为E2E测试使用独立的Supabase项目
4. **监控测试用户** - 定期检查测试用户状态

## 相关文件

- `e2e/.env.example` - 环境变量示例
- `e2e/specs/task-assignment.spec.ts` - 任务分配测试
- `e2e/utils/task-test-helpers.ts` - 测试辅助函数
- `e2e/pages/AddMemberDialog.ts` - 添加成员对话框页面对象