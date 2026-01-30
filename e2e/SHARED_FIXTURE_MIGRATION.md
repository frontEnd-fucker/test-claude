# 共享Fixture迁移指南

## 概述
本文档指导如何将现有的Playwright测试迁移到使用共享fixture，以实现所有测试用例共享登录状态，避免每个测试用例都需要重复登录。

## 已完成的更改

### 1. 新增文件
- `e2e/utils/auth-fixtures.ts` - 共享fixture定义
- `e2e/create-project-shared-fixture.spec.ts` - 使用共享fixture的示例测试文件
- `e2e/create-project-pom.spec.ts.bak` - 原测试文件的备份

### 2. 修改的文件
- `e2e/create-project-pom.spec.ts` - 已迁移到使用共享fixture

## 共享Fixture详解

### 提供的Fixtures（简化版）

| Fixture名称 | 类型 | 描述 |
|------------|------|------|
| `loggedInPage` | `Page` | 已登录的页面对象，自动处理登录流程 |
| `loggedInContext` | `BrowserContext` | 已登录的浏览器上下文 |
| `testUser` | `{email: string, password: string}` | 测试用户凭据，从环境变量读取 |

**注意**：不再提供`loginPage`、`projectsPage`、`projectFormDialog`等页面对象作为独立fixture。测试应该从`loggedInPage`自行创建所需的页面对象。

### 使用方式

#### 方式1：使用已登录的页面（推荐）
```typescript
import { test, expect } from "./utils/auth-fixtures";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectFormDialog } from "./pages/ProjectFormDialog";

test("测试用例", async ({
  loggedInPage      // 已登录的页面
}) => {
  // 从已登录的页面创建所需页面对象
  const projectsPage = new ProjectsPage(loggedInPage);
  const projectFormDialog = new ProjectFormDialog(loggedInPage);

  // loggedInPage已经是登录状态
  await projectsPage.goto();
  // ... 测试逻辑
});
```


## 迁移步骤

### 步骤1：更新导入语句
```diff
- import { test, expect } from "@playwright/test";
- import { LoginPage } from "./pages/LoginPage";
- import { ProjectsPage } from "./pages/ProjectsPage";
- import { ProjectFormDialog } from "./pages/ProjectFormDialog";
+ import { test, expect } from "./utils/auth-fixtures";
```

### 步骤2：移除测试用户定义
```diff
- const TEST_USER = {
-   email: process.env.TEST_USER_EMAIL || "markzuckerg@gmail.com",
-   password: process.env.TEST_USER_PASSWORD || "123123",
- };
```

### 步骤3：移除beforeEach钩子
```diff
- let loginPage: LoginPage;
- let projectsPage: ProjectsPage;
- let projectFormDialog: ProjectFormDialog;
-
- test.beforeEach(async ({ page }) => {
-   loginPage = new LoginPage(page);
-   projectsPage = new ProjectsPage(page);
-   projectFormDialog = new ProjectFormDialog(page);
-   // ... 其他初始化逻辑
- });
```

### 步骤4：更新测试函数参数并创建POM对象
```diff
- test("测试用例", async ({ page }) => {
+ test("测试用例", async ({
+   loggedInPage
+ }) => {
+   // 从已登录的页面创建所需POM对象
+   const projectsPage = new ProjectsPage(loggedInPage);
+   const projectFormDialog = new ProjectFormDialog(loggedInPage);
```

### 步骤5：移除登录逻辑
```diff
- await test.step("登录用户", async () => {
-   if (page.url().includes("/auth/login")) {
-     await loginPage.login(TEST_USER.email, TEST_USER.password);
-     await loginPage.waitForLoginSuccess();
-   }
- });
+ // 登录逻辑已由loggedInPage fixture自动处理
```

### 步骤6：更新页面引用
```diff
- await loginPage.login(TEST_USER.email, TEST_USER.password);
- await projectsPage.goto();
- await projectFormDialog.createProject(...);
+ // loggedInPage已自动登录，使用本地创建的POM对象
+ await projectsPage.goto();
+ await projectFormDialog.createProject(...);
```

## 优势

### 1. 代码重用
- 登录逻辑集中在一处，避免重复
- 页面对象通过fixture自动初始化

### 2. 测试性能
- 共享登录状态，减少不必要的登录操作
- 更快的测试执行速度

### 3. 可维护性
- 登录逻辑变更只需修改一处
- 更清晰的测试代码结构

### 4. 一致性
- 所有测试使用相同的登录方式
- 减少因登录逻辑不一致导致的测试失败

## 注意事项

### 1. 测试隔离
共享fixture会在测试之间共享登录状态，但每个测试仍然有独立的浏览器上下文。如果需要完全隔离的测试环境，可以使用以下方法：

```typescript
// 在测试文件中重新定义独立的fixture
import { test as base } from './utils/auth-fixtures';
import { LoginPage } from './pages/LoginPage';

const test = base.extend({
  // 覆盖loggedInPage，使其在每个测试中重新登录
  loggedInPage: async ({ page, testUser }, use) => {
    // 每次使用都重新登录
    const loginPage = new LoginPage(page);
    await page.goto('/auth/login');
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForLoginSuccess();
    await use(page);
  },
});
```

### 2. 并行测试
共享fixture支持并行测试，每个worker有独立的fixture实例。

### 3. 环境变量
确保正确配置环境变量：
```bash
# .env.local
TEST_USER_EMAIL=your_test_email@example.com
TEST_USER_PASSWORD=your_test_password
```

### 4. 回退方案
如果遇到问题，可以恢复备份文件：
```bash
cp e2e/create-project-pom.spec.ts.bak e2e/create-project-pom.spec.ts
```

## 下一步

1. 运行测试验证迁移是否成功：
   ```bash
   npm run test:e2e
   ```

2. 将其他测试文件迁移到使用共享fixture

3. 考虑将test-helpers.ts中的函数整合到fixture中

## 参考

- [Playwright Fixtures文档](https://playwright.dev/docs/test-fixtures)
- [Playwright 共享Fixture最佳实践](https://playwright.dev/docs/test-fixtures#shared-fixtures)