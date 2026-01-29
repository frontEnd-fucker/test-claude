import { Page } from '@playwright/test';

/**
 * 测试辅助工具函数
 */

/**
 * 确保用户已登录
 * @param page Playwright页面对象
 * @param email 用户邮箱
 * @param password 用户密码
 */
export async function ensureLoggedIn(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // 检查当前页面是否需要登录
  if (page.url().includes('/auth/login')) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    // 使用精确的选择器，避免匹配多个按钮
    await page.locator('form button[type="submit"]')
      .or(page.locator('form').getByRole('button', { name: 'Sign In', exact: true }))
      .or(page.locator('.w-full.max-w-md').getByRole('button', { name: 'Sign In', exact: true }))
      .first()
      .click();
    await page.waitForURL('**/projects');
  } else if (!page.url().includes('/projects')) {
    // 如果不在项目页面，导航到项目页面
    await page.goto('/projects');
  }
}

/**
 * 生成唯一的项目名称
 * @param prefix 名称前缀
 * @returns 唯一的项目名称
 */
export function generateUniqueProjectName(prefix = 'Test Project'): string {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * 等待元素出现并可见
 * @param page Playwright页面对象
 * @param selector 选择器
 * @param timeout 超时时间（毫秒）
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * 等待元素包含特定文本
 * @param page Playwright页面对象
 * @param selector 选择器
 * @param text 期望的文本
 * @param timeout 超时时间（毫秒）
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (args: { selector: string; text: string }) => {
      const element = document.querySelector(args.selector);
      return element?.textContent?.includes(args.text);
    },
    { selector, text },
    { timeout }
  );
}

/**
 * 截取屏幕截图并保存
 * @param page Playwright页面对象
 * @param name 截图名称
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `test-results/screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

/**
 * 创建测试项目
 * @param page Playwright页面对象
 * @param projectName 项目名称
 * @param description 项目描述（可选）
 */
export async function createTestProject(
  page: Page,
  projectName: string,
  description?: string
): Promise<void> {
  // 导航到项目页面
  await page.goto('/projects');

  // 点击"New Project"按钮
  const newProjectButton = page.getByRole('button', { name: /new project|create first project/i }).first();
  await newProjectButton.click();

  // 等待对话框打开
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });

  // 填写项目名称
  const nameInput = page.getByLabel('Project Name').or(page.getByPlaceholder('My Project'));
  await nameInput.fill(projectName);

  // 填写项目描述（如果提供）
  if (description) {
    const descriptionInput = page.getByLabel('Description (optional)').or(page.getByPlaceholder('Project description...'));
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(description);
    }
  }

  // 点击创建按钮
  const createButton = page.getByRole('button', { name: /create project/i });
  await createButton.click();

  // 等待对话框关闭
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

  // 等待项目出现在列表中
  await page.waitForTimeout(1000);
}

/**
 * 清理测试项目
 * @param page Playwright页面对象
 * @param projectName 项目名称
 */
export async function cleanupTestProject(
  page: Page,
  projectName: string
): Promise<void> {
  // 导航到项目页面
  await page.goto('/projects');

  // 查找项目卡片
  const projectCard = page.locator('[data-testid="project-card"]', { hasText: projectName }).first();

  if (await projectCard.isVisible()) {
    // 点击项目菜单按钮（如果有）
    const menuButton = projectCard.locator('button[aria-label*="menu"], button[aria-label*="options"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // 点击删除选项
      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        // 确认删除
        const confirmButton = page.getByRole('button', { name: /delete|confirm/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  }
}

/**
 * 获取项目数量
 * @param page Playwright页面对象
 * @returns 项目数量
 */
export async function getProjectCount(page: Page): Promise<number> {
  await page.goto('/projects');
  const projectCards = page.locator('[data-testid="project-card"]');
  return await projectCards.count();
}

/**
 * 检查项目是否存在
 * @param page Playwright页面对象
 * @param projectName 项目名称
 * @returns 是否存在
 */
export async function projectExists(
  page: Page,
  projectName: string
): Promise<boolean> {
  await page.goto('/projects');
  const projectCard = page.locator('[data-testid="project-card"]', { hasText: projectName });
  return await projectCard.isVisible();
}