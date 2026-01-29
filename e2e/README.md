# E2E测试 - 项目创建功能

本目录包含使用Playwright编写的项目创建功能的端到端测试。

## 测试结构

```
e2e/
├── create-project.spec.ts          # 基础测试文件
├── create-project-pom.spec.ts      # 使用Page Object Model的测试
├── pages/                          # 页面对象模型
│   ├── LoginPage.ts
│   ├── ProjectsPage.ts
│   └── ProjectFormDialog.ts
├── utils/                          # 测试工具函数
│   └── test-helpers.ts
├── .env.example                    # 环境变量示例
└── README.md                       # 本文档
```

## 测试场景

### 1. 基础测试 (`create-project.spec.ts`)
- 用户登录流程
- 创建带描述的项目
- 验证必填字段
- 取消项目创建

### 2. Page Object Model测试 (`create-project-pom.spec.ts`)
- 使用Page Object Model封装页面逻辑
- 创建不同类型项目（带描述、无描述、长名称）
- 空状态和列表状态的测试
- 更清晰的测试步骤和断言

## 运行测试

### 前置要求
1. 安装Playwright：
   ```bash
   npm init playwright@latest
   ```

2. 安装浏览器：
   ```bash
   npx playwright install
   ```

3. 配置环境变量：
   ```bash
   cp e2e/.env.example e2e/.env
   # 编辑e2e/.env文件，填写测试用户凭据
   ```

### 运行测试

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **运行所有测试**：
   ```bash
   npx playwright test
   ```

3. **运行特定测试文件**：
   ```bash
   npx playwright test create-project.spec.ts
   npx playwright test create-project-pom.spec.ts
   ```

4. **调试模式运行**：
   ```bash
   npx playwright test --debug
   ```

5. **有头模式运行**（可以看到浏览器）：
   ```bash
   npx playwright test --headed
   ```

6. **生成测试报告**：
   ```bash
   npx playwright show-report
   ```

## 测试数据

测试使用以下环境变量：
- `TEST_USER_EMAIL`: 测试用户邮箱
- `TEST_USER_PASSWORD`: 测试用户密码

如果没有设置环境变量，测试将使用默认值：
- 邮箱: `test@example.com`
- 密码: `password123`

## Page Object Model

### LoginPage
- `goto()`: 导航到登录页面
- `login(email, password)`: 执行登录操作
- `waitForLoginSuccess()`: 等待登录成功

### ProjectsPage
- `goto()`: 导航到项目页面
- `openNewProjectDialog()`: 打开项目创建对话框
- `getProjectCount()`: 获取项目数量
- `hasProject(name)`: 检查项目是否存在
- `waitForProjectToAppear(name)`: 等待项目出现

### ProjectFormDialog
- `waitForOpen()`: 等待对话框打开
- `waitForClose()`: 等待对话框关闭
- `fillForm(name, description)`: 填写表单
- `createProject(name, description)`: 创建项目
- `cancel()`: 取消操作

## 测试工具函数

### test-helpers.ts
- `ensureLoggedIn()`: 确保用户已登录
- `generateUniqueProjectName()`: 生成唯一项目名称
- `createTestProject()`: 创建测试项目
- `cleanupTestProject()`: 清理测试项目
- `projectExists()`: 检查项目是否存在

## 最佳实践

### 1. 使用适当的等待策略
- 避免使用固定等待 (`page.waitForTimeout()`)
- 使用Playwright的自动等待机制
- 使用`waitForSelector`、`waitForURL`等

### 2. 使用可靠的选择器
- 优先使用`getByRole`、`getByLabel`、`getByText`
- 避免使用CSS类名或复杂的选择器
- 考虑添加`data-testid`属性以便测试

### 3. 保持测试独立
- 每个测试应该独立运行
- 清理测试数据
- 使用唯一的测试数据

### 4. 使用测试步骤
- 使用`test.step()`组织测试逻辑
- 使测试报告更清晰
- 便于调试和问题定位

## 调试技巧

### 1. 查看测试报告
```bash
npx playwright show-report
```

### 2. 跟踪测试执行
```bash
npx playwright test --trace on
```

### 3. 查看截图
测试失败时会自动截图，保存在`test-results/`目录

### 4. 使用VSCode调试
安装Playwright Test for VSCode扩展，可以直接在编辑器中调试测试。

## CI/CD集成

### GitHub Actions示例
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## 常见问题

### 1. 测试找不到元素
- 检查页面是否完全加载
- 验证选择器是否正确
- 考虑添加`data-testid`属性

### 2. 测试超时
- 增加超时时间
- 检查网络请求是否完成
- 验证应用是否正常运行

### 3. 测试不稳定
- 避免竞态条件
- 使用适当的等待策略
- 确保测试数据唯一

### 4. 认证问题
- 确保测试用户存在
- 检查认证流程是否正确
- 验证环境变量配置