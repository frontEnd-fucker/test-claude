import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectFormDialog } from '../pages/ProjectFormDialog';

// 定义fixture类型
export type AuthFixtures = {
  // 基础fixtures
  authenticatedPage: Page;
  testUser: { email: string; password: string };

  // 页面对象fixtures
  loginPage: LoginPage;
  projectsPage: ProjectsPage;
  projectFormDialog: ProjectFormDialog;

  // 辅助fixtures
  ensureLoggedIn: () => Promise<void>;
};

// 从环境变量获取测试用户凭据
function getTestUser() {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'password123';

  // 在非CI环境下输出警告
  if (!process.env.CI && (email === 'test@example.com' || password === 'password123')) {
    console.warn(`
⚠️ 警告: 使用默认测试用户凭据
建议配置环境变量:
- TEST_USER_EMAIL=你的测试邮箱
- TEST_USER_PASSWORD=你的测试密码

详见: e2e/TEST_USER_SETUP.md
`);
  }

  return { email, password };
}

// 扩展基础test fixture
export const test = base.extend<AuthFixtures>({
  // 测试用户凭据
  testUser: async ({}, use) => {
    const user = getTestUser();
    await use(user);
  },

  // 登录页面对象
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // 项目页面对象
  projectsPage: async ({ page }, use) => {
    const projectsPage = new ProjectsPage(page);
    await use(projectsPage);
  },

  // 项目表单对话框对象
  projectFormDialog: async ({ page }, use) => {
    const projectFormDialog = new ProjectFormDialog(page);
    await use(projectFormDialog);
  },

  // 确保登录的辅助函数
  ensureLoggedIn: async ({ page, loginPage, testUser }, use) => {
    const ensureLoggedIn = async () => {
      // 导航到首页检查登录状态
      await page.goto('/', { waitUntil: 'networkidle' });

      // 检查是否在登录页面
      if (page.url().includes('/auth/login')) {
        console.log(`检测到未登录状态，正在登录用户: ${testUser.email}`);
        await loginPage.login(testUser.email, testUser.password);
        await loginPage.waitForLoginSuccess();
        console.log('登录成功');
      } else if (!page.url().includes('/projects')) {
        // 如果不在项目页面，导航到项目页面
        await page.goto('/projects');
      }
    };

    await use(ensureLoggedIn);
  },

  // 已认证的页面（自动登录）
  authenticatedPage: async ({ page, loginPage, testUser }, use) => {
    // 导航到首页检查登录状态
    await page.goto('/', { waitUntil: 'networkidle' });

    // 检查是否在登录页面
    if (page.url().includes('/auth/login')) {
      console.log(`检测到未登录状态，正在登录用户: ${testUser.email}`);
      await loginPage.login(testUser.email, testUser.password);
      await loginPage.waitForLoginSuccess();
      console.log('登录成功，准备使用已认证页面');
    } else if (!page.url().includes('/projects')) {
      // 如果不在项目页面，导航到项目页面
      await page.goto('/projects');
    }

    // 确保在项目页面
    if (!page.url().includes('/projects')) {
      await page.goto('/projects');
    }

    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

// 重新导出expect
export { expect } from '@playwright/test';