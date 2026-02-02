import { Page, expect } from "@playwright/test";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectFormDialog } from "../pages/ProjectFormDialog";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { AddMemberDialog } from "../pages/AddMemberDialog";

/**
 * 成员测试辅助工具函数
 */

/**
 * 生成唯一的测试标识符
 * @param prefix 前缀
 * @returns 唯一的测试标识符
 */
export function generateTestId(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 生成测试成员数据
 * @param testId 测试标识符
 * @returns 测试成员数据
 */
export function generateTestMemberData(testId: string) {
  return {
    project: {
      name: `Test Project ${testId}`,
      description: `Test project for member management ${testId}`,
    },
    member: {
      email: process.env.TEST_MEMBER_EMAIL || "test.member@example.com",
      name: "Test Member",
      role: "member" as const,
    },
    owner: {
      email: process.env.TEST_USER_EMAIL || "test.user@example.com",
      name: "Test User",
    },
  };
}

/**
 * 创建测试项目
 * @param page Playwright页面对象
 * @param projectName 项目名称
 * @param description 项目描述（可选）
 * @returns 项目页面对象
 */
export async function createTestProject(
  page: Page,
  projectName: string,
  description?: string
): Promise<ProjectsPage> {
  const projectsPage = new ProjectsPage(page);
  const projectFormDialog = new ProjectFormDialog(page);

  await projectsPage.goto();
  await projectsPage.openNewProjectDialog();
  await projectFormDialog.createProject(projectName, description);
  await projectsPage.waitForProjectToAppear(projectName);

  return projectsPage;
}

/**
 * 获取项目ID
 * @param page Playwright页面对象
 * @param projectName 项目名称
 * @returns 项目ID
 */
export async function getProjectIdByName(page: Page, projectName: string): Promise<string> {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.goto();

  // 获取项目卡片
  const projectCard = page.locator(`[data-testid="project-card"]`, {
    hasText: projectName,
  });

  if (!(await projectCard.isVisible())) {
    throw new Error(`Project "${projectName}" not found`);
  }

  // 从项目卡片获取项目ID
  const href = await projectCard.getAttribute("href");
  if (!href) {
    throw new Error(`Could not get project ID for "${projectName}"`);
  }

  // 从URL中提取项目ID
  const match = href.match(/\/project\/([^\/]+)/);
  if (!match) {
    throw new Error(`Invalid project URL: ${href}`);
  }

  return match[1];
}

/**
 * 设置成员测试环境
 * @param page Playwright页面对象
 * @param testId 测试标识符
 * @returns 设置结果
 */
export async function setupProjectForMemberTest(
  page: Page,
  testId: string
): Promise<{
  projectId: string;
  projectName: string;
  projectDetailPage: ProjectDetailPage;
  testData: ReturnType<typeof generateTestMemberData>;
}> {
  const testData = generateTestMemberData(testId);

  // 创建测试项目
  await createTestProject(page, testData.project.name, testData.project.description);

  // 获取项目ID
  const projectId = await getProjectIdByName(page, testData.project.name);

  // 导航到项目详情页
  const projectDetailPage = new ProjectDetailPage(page);
  await projectDetailPage.goto(projectId);

  return {
    projectId,
    projectName: testData.project.name,
    projectDetailPage,
    testData,
  };
}

/**
 * 添加测试成员到项目
 * @param page Playwright页面对象
 * @param projectId 项目ID
 * @param memberEmail 成员邮箱
 * @param role 角色（可选）
 * @returns 添加成员对话框对象
 */
export async function addTestMemberToProject(
  page: Page,
  projectId: string,
  memberEmail: string,
  role: "member" | "admin" | "viewer" = "member"
): Promise<AddMemberDialog> {
  const projectDetailPage = new ProjectDetailPage(page);
  await projectDetailPage.goto(projectId);

  // 打开添加成员对话框
  const addMemberDialog = await projectDetailPage.openAddMemberDialog();

  // 添加成员
  await addMemberDialog.addMemberByEmail(memberEmail, role);

  return addMemberDialog;
}

/**
 * 验证成员添加成功
 * @param projectDetailPage 项目详情页面对象
 * @param memberEmail 成员邮箱
 */
export async function verifyMemberAdded(
  projectDetailPage: ProjectDetailPage,
  memberEmail: string
): Promise<void> {
  // 等待成员出现
  await projectDetailPage.waitForMember(memberEmail);

  // 验证成员数量增加
  const count = await projectDetailPage.getMemberCount();
  expect(count).toBeGreaterThan(0);

  // 验证成员存在
  const hasMember = await projectDetailPage.hasMember(memberEmail);
  expect(hasMember).toBe(true);
}

/**
 * 验证成员删除成功
 * @param projectDetailPage 项目详情页面对象
 * @param memberEmail 成员邮箱
 * @param initialCount 初始成员数量（可选）
 */
export async function verifyMemberRemoved(
  projectDetailPage: ProjectDetailPage,
  memberEmail: string,
  initialCount?: number
): Promise<void> {
  // 等待成员消失
  await projectDetailPage.waitForMemberRemoved(memberEmail);

  // 验证成员数量减少
  if (initialCount !== undefined) {
    const newCount = await projectDetailPage.getMemberCount();
    expect(newCount).toBe(initialCount - 1);
  }

  // 验证成员不存在
  const hasMember = await projectDetailPage.hasMember(memberEmail);
  expect(hasMember).toBe(false);
}

/**
 * 清理成员测试数据
 * @param page Playwright页面对象
 * @param projectName 项目名称
 */
export async function cleanupMemberTestData(
  page: Page,
  projectName: string
): Promise<void> {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.goto();

  try {
    // 删除测试项目
    await projectsPage.deleteProject(projectName);

    // 验证项目已删除
    await projectsPage.waitForProjectToDisappear(projectName);
  } catch (error) {
    console.warn(`Failed to cleanup test data for project "${projectName}":`, error);
  }
}

/**
 * 获取测试成员邮箱
 * @returns 测试成员邮箱
 */
export function getTestMemberEmail(): string {
  return process.env.TEST_MEMBER_EMAIL || "test.member@example.com";
}

/**
 * 获取测试用户邮箱
 * @returns 测试用户邮箱
 */
export function getTestUserEmail(): string {
  return process.env.TEST_USER_EMAIL || "test.user@example.com";
}

/**
 * 检查测试成员邮箱是否配置
 * @returns 是否配置
 */
export function isTestMemberEmailConfigured(): boolean {
  return !!process.env.TEST_MEMBER_EMAIL;
}

/**
 * 检查测试用户邮箱是否配置
 * @returns 是否配置
 */
export function isTestUserEmailConfigured(): boolean {
  return !!process.env.TEST_USER_EMAIL;
}