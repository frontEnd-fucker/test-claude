# E2E测试指南

本文档说明如何设置和运行项目创建功能的E2E测试。

## 快速开始

### 1. 安装依赖
```bash
# 安装项目依赖
npm install

# 安装Playwright浏览器
npm run test:e2e:install
```

### 2. 配置环境变量
```bash
# 复制环境变量示例文件
cp e2e/.env.example e2e/.env

# 编辑e2e/.env文件，填写测试用户凭据
# 需要有效的Supabase测试用户邮箱和密码
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 运行测试
```bash
# 运行所有E2E测试
npm run test:e2e

# 运行UI模式（可视化）
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 有头模式（可以看到浏览器）
npm run test:e2e:headed
```

## 测试文件说明

### 1. 基础测试 (`e2e/create-project.spec.ts`)
- 包含4个测试场景
- 直接使用Playwright API
- 适合快速验证功能

### 2. Page Object Model测试 (`e2e/create-project-pom.spec.ts`)
- 使用Page Object Model设计模式
- 更好的代码组织和重用
- 包含5个测试场景

### 3. 页面对象 (`e2e/pages/`)
- `LoginPage.ts`: 登录页面封装
- `ProjectsPage.ts`: 项目列表页面封装
- `ProjectFormDialog.ts`: 项目表单对话框封装

### 4. 工具函数 (`e2e/utils/test-helpers.ts`)
- 测试辅助函数
- 测试数据生成
- 测试清理函数

## 测试场景

### 场景1: 成功创建带描述的项目
- 用户登录
- 导航到项目页面
- 打开项目创建对话框
- 填写项目名称和描述
- 提交表单
- 验证项目出现在列表中

### 场景2: 创建没有描述的项目
- 测试可选字段
- 验证只有名称也能创建项目

### 场景3: 验证必填字段
- 尝试提交空表单
- 验证表单阻止提交
- 填写有效名称后成功提交

### 场景4: 取消项目创建
- 打开对话框并填写数据
- 点击取消按钮
- 验证对话框关闭
- 验证项目没有被创建

### 场景5: 空状态和列表状态
- 测试没有项目时的"Create First Project"按钮
- 测试有项目时的"New Project"按钮
- 验证两种状态都能正常工作

## 测试数据管理

### 唯一项目名称
每个测试使用唯一的时间戳和随机字符串生成项目名称，避免测试冲突：
```typescript
const projectName = `Test Project ${Date.now()} ${Math.random().toString(36).substring(2, 7)}`;
```

### 环境变量
测试使用环境变量配置：
- `TEST_USER_EMAIL`: 测试用户邮箱
- `TEST_USER_PASSWORD`: 测试用户密码

如果没有设置，使用默认值：
- 邮箱: `test@example.com`
- 密码: `password123`

## 调试技巧

### 1. 查看测试报告
```bash
npm run test:e2e:report
```

### 2. 生成测试代码
```bash
npm run test:e2e:codegen
```

### 3. 查看截图和跟踪
测试失败时会自动生成：
- 截图: `test-results/screenshots/`
- 跟踪文件: `test-results/traces/`

### 4. 慢速执行（调试）
在`e2e/.env`中设置：
```bash
SLOW_MO=1000  # 每个操作延迟1秒
HEADLESS=false  # 显示浏览器
```

## CI/CD集成

### GitHub Actions配置
在`.github/workflows/e2e.yml`中添加：
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: npm ci
    - run: npm run test:e2e:install
    - run: npm run test:e2e
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## 最佳实践

### 1. 选择器策略
- 优先使用：`getByRole()`, `getByLabel()`, `getByText()`
- 避免使用：CSS类名、复杂选择器
- 考虑添加：`data-testid`属性

### 2. 等待策略
- 使用：`waitForSelector()`, `waitForURL()`, `waitForLoadState()`
- 避免使用：`page.waitForTimeout()`（除非必要）
- 利用：Playwright的自动等待机制

### 3. 测试组织
- 使用`test.describe()`分组相关测试
- 使用`test.step()`组织测试步骤
- 保持测试独立，不依赖执行顺序

### 4. 错误处理
- 使用try-catch处理预期错误
- 添加有意义的错误消息
- 失败时截图帮助调试

## 常见问题

### Q1: 测试找不到"New Project"按钮
**可能原因**：
1. 页面没有完全加载
2. 用户没有登录
3. 选择器不正确

**解决方案**：
1. 添加等待：`await page.waitForLoadState('networkidle')`
2. 验证登录状态
3. 使用更可靠的选择器

### Q2: 测试超时
**可能原因**：
1. 网络请求慢
2. 应用响应慢
3. 等待条件不满足

**解决方案**：
1. 增加超时时间
2. 检查应用是否正常运行
3. 使用更具体的等待条件

### Q3: 测试不稳定（flaky）
**可能原因**：
1. 竞态条件
2. 网络延迟
3. 测试数据冲突

**解决方案**：
1. 使用适当的等待策略
2. 生成唯一测试数据
3. 添加重试机制

### Q4: 认证失败
**可能原因**：
1. 测试用户不存在
2. 密码错误
3. 认证流程变更

**解决方案**：
1. 验证测试用户凭据
2. 检查认证流程
3. 更新测试代码

## 扩展测试

### 添加更多测试场景
1. **编辑项目**：测试项目编辑功能
2. **删除项目**：测试项目删除功能
3. **项目详情**：测试项目详情页面
4. **权限测试**：测试不同用户的权限

### 性能测试
1. **加载性能**：测试页面加载时间
2. **响应性能**：测试操作响应时间
3. **并发测试**：测试多个用户同时操作

### 跨浏览器测试
在`playwright.config.ts`中启用更多浏览器：
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

## 贡献指南

1. 为新功能添加E2E测试
2. 保持测试代码简洁可读
3. 遵循现有的测试模式
4. 确保测试独立可靠
5. 添加有意义的测试描述