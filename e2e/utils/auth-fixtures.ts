import { test as base, Page, BrowserContext } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

// 定义fixture类型
export type AuthFixtures = {
  // 核心共享fixtures
  loggedInPage: Page;
  loggedInContext: BrowserContext;
};

// 扩展基础test fixture
export const test = base.extend<AuthFixtures>({
  // 定义fixture：每个测试前初始化（测试级别）
  loggedInContext: async ({ browser }, use) => {
    // 1. 创建新上下文
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    // 2. 执行登录
    await page.goto("/auth/login");
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );
    await loginPage.waitForLoginSuccess();

    console.log("✅ 测试登录完成");

    // 3. 把这个上下文提供给测试使用
    await use(context);

    // 4. 测试结束后关闭
    await context.close();
  },

  // 基于上面的上下文，提供一个已登录的 page
  loggedInPage: async ({ loggedInContext }, use) => {
    const page = await loggedInContext.newPage();
    await use(page);
    await page.close();
  },
});

// 重新导出expect
export { expect } from "@playwright/test";
