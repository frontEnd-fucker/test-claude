import { Page, Locator } from "@playwright/test";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectFormDialog } from "../pages/ProjectFormDialog";
import { TaskFormDialog } from "../pages/TaskFormDialog";
import { AddMemberDialog } from "../pages/AddMemberDialog";
import { TaskDetailPage } from "../pages/TaskDetailPage";

/**
 * 任务测试辅助工具函数
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
 * 生成测试任务数据
 * @param testId 测试标识符
 * @returns 测试任务数据
 */
export function generateTestTaskData(testId: string) {
  return {
    project: {
      name: `Test Project ${testId}`,
      description: `Test project for task assignment ${testId}`,
    },
    task: {
      title: `Test Task ${testId}`,
      description: `Test task for assignment testing ${testId}`,
      priority: "medium" as const,
    },
    member: {
      email: process.env.TEST_MEMBER_EMAIL || "test.member@example.com",
      name: process.env.TEST_MEMBER_NAME,
      role: "member" as const,
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
 * 添加测试成员到项目
 * @param page Playwright页面对象
 * @param memberEmail 成员邮箱
 * @param memberName 成员名称（可选）
 * @param role 角色（可选）
 */
export async function addTestMemberToProject(
  page: Page,
  memberEmail: string,
  memberName?: string,
  role: "member" | "admin" | "viewer" = "member"
): Promise<void> {
  const addMemberDialog = new AddMemberDialog(page);

  // 打开添加成员对话框
  await addMemberDialog.open();

  // 添加成员
  if (memberName) {
    await addMemberDialog.addExistingUser(memberEmail, memberName, role);
  } else {
    await addMemberDialog.addMemberByEmail(memberEmail, role);
  }

  // 等待成员添加完成
  await page.waitForTimeout(1000);
}

/**
 * 创建测试任务
 * @param page Playwright页面对象
 * @param taskTitle 任务标题
 * @param taskDescription 任务描述（可选）
 * @param priority 优先级（可选）
 * @returns 创建的任务ID（从URL中提取）
 */
export async function createTestTask(
  page: Page,
  taskTitle: string,
  taskDescription?: string,
  priority?: "low" | "medium" | "high"
): Promise<string> {
  const taskFormDialog = new TaskFormDialog(page);

  // 打开任务创建对话框
  await taskFormDialog.open();

  // 创建任务
  await taskFormDialog.createTask(taskTitle, taskDescription, priority);

  // 从URL中提取任务ID
  await page.waitForURL(/\/task\//);
  const url = page.url();
  const taskIdMatch = url.match(/\/task\/([^\/]+)/);

  if (!taskIdMatch) {
    throw new Error("无法从URL中提取任务ID");
  }

  return taskIdMatch[1];
}

/**
 * 导航到项目页面并获取项目ID
 * @param page Playwright页面对象
 * @param projectName 项目名称
 * @returns 项目ID
 */
export async function getProjectIdByName(
  page: Page,
  projectName: string
): Promise<string> {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.goto();

  // 点击项目卡片进入项目详情页
  const projectCard = await projectsPage.getProjectCardByName(projectName);
  await projectCard.waitFor({ state: "visible" });

  // 尝试点击卡片内的Link（如果有的话）
  const projectCardLink = projectCard.locator(
    '[data-testid="project-card-link"]'
  );
  if (await projectCardLink.isVisible()) {
    await projectCardLink.click();
  } else {
    await projectCard.click();
  }

  // 从URL中提取项目ID
  await page.waitForURL(/\/project\//, { timeout: 30000 });
  const url = page.url();
  const projectIdMatch = url.match(/\/project\/([^\/]+)/);

  if (!projectIdMatch) {
    throw new Error("无法从URL中提取项目ID");
  }

  return projectIdMatch[1];
}

/**
 * 设置任务分配测试环境
 * @param page Playwright页面对象
 * @param testId 测试标识符
 * @returns 包含项目ID、任务ID和任务详情页面的对象
 */
export async function setupTaskForAssignmentTest(
  page: Page,
  testId: string
): Promise<{
  projectId: string;
  taskId: string;
  taskDetailPage: TaskDetailPage;
  addMemberDialog: AddMemberDialog;
}> {
  const testData = generateTestTaskData(testId);

  // 1. 创建测试项目
  await createTestProject(
    page,
    testData.project.name,
    testData.project.description
  );

  // 2. 获取项目ID
  const projectId = await getProjectIdByName(page, testData.project.name);

  // 3. 创建测试任务
  const taskId = await createTestTask(
    page,
    testData.task.title,
    testData.task.description,
    testData.task.priority
  );

  // 4. 创建任务详情页面对象
  const taskDetailPage = new TaskDetailPage(page);
  const addMemberDialog = new AddMemberDialog(page);

  await taskDetailPage.goto(projectId, taskId);

  return {
    projectId,
    taskId,
    taskDetailPage,
    addMemberDialog,
  };
}

/**
 * 设置包含成员的任务分配测试环境
 * @param page Playwright页面对象
 * @param testId 测试标识符
 * @param memberEmail 成员邮箱（可选，使用环境变量或默认值）
 * @returns 包含项目ID、任务ID、任务详情页面和成员信息的对象
 */
export async function setupTaskWithMemberForAssignmentTest(
  page: Page,
  testId: string,
  memberEmail?: string
): Promise<{
  projectId: string;
  taskId: string;
  taskDetailPage: TaskDetailPage;
  memberEmail: string;
  addMemberDialog: AddMemberDialog;
}> {
  const testData = generateTestTaskData(testId);
  const actualMemberEmail = memberEmail || testData.member.email;

  // 1. 创建测试项目
  await createTestProject(
    page,
    testData.project.name,
    testData.project.description
  );

  // 2. 获取项目ID
  const projectId = await getProjectIdByName(page, testData.project.name);

  // 3. 添加测试成员
  await addTestMemberToProject(
    page,
    actualMemberEmail,
    testData.member.name,
    testData.member.role
  );

  // 4. 创建测试任务
  const taskId = await createTestTask(
    page,
    testData.task.title,
    testData.task.description,
    testData.task.priority
  );

  // 5. 创建任务详情页面对象
  const taskDetailPage = new TaskDetailPage(page);
  const addMemberDialog = new AddMemberDialog(page);

  await taskDetailPage.goto(projectId, taskId);

  return {
    projectId,
    taskId,
    taskDetailPage,
    memberEmail: actualMemberEmail,
    addMemberDialog,
  };
}

/**
 * 清理测试数据
 * @param page Playwright页面对象
 * @param projectName 项目名称
 */
export async function cleanupAssignmentTestData(
  page: Page,
  projectName: string
): Promise<void> {
  const projectsPage = new ProjectsPage(page);

  try {
    await projectsPage.goto();

    // 检查项目是否存在
    if (await projectsPage.hasProject(projectName)) {
      // 删除项目
      await projectsPage.deleteProject(projectName);

      // 验证项目已删除
      const hasProject = await projectsPage.hasProject(projectName);
      if (hasProject) {
        console.warn(`项目 "${projectName}" 删除失败`);
      }
    }
  } catch (error) {
    console.error(`清理测试数据时出错: ${error}`);
  }
}

/**
 * 获取当前登录用户的邮箱
 * @param page Playwright页面对象
 * @returns 用户邮箱
 */
export async function getCurrentUserEmail(page: Page): Promise<string> {
  // 尝试从用户菜单或页面中获取用户邮箱
  const userMenuButton = page
    .locator('[data-testid="user-menu-button"]')
    .or(page.locator('button:has-text("@")'));

  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();

    const userEmail = page
      .locator('[data-testid="user-email"]')
      .or(page.locator("text=@").first());

    if (await userEmail.isVisible()) {
      const email = await userEmail.textContent();
      await page.keyboard.press("Escape"); // 关闭菜单
      return email?.trim() || "";
    }

    await page.keyboard.press("Escape"); // 关闭菜单
  }

  // 如果无法获取，返回环境变量中的测试用户邮箱
  return process.env.TEST_USER_EMAIL || "";
}

/**
 * 验证任务分配状态
 * @param taskDetailPage 任务详情页面对象
 * @param expectedAssignee 期望的分配者，null表示未分配
 */
export async function verifyTaskAssignment(
  taskDetailPage: TaskDetailPage,
  expectedAssignee: string | null
): Promise<void> {
  const currentAssignee = await taskDetailPage.getCurrentAssignee();

  if (expectedAssignee === null) {
    if (currentAssignee !== "Unassigned") {
      throw new Error(`期望任务未分配，但当前分配者为: ${currentAssignee}`);
    }
  } else {
    if (!currentAssignee.includes(expectedAssignee)) {
      throw new Error(
        `期望分配者为 "${expectedAssignee}"，但当前分配者为: ${currentAssignee}`
      );
    }
  }
}

/**
 * 等待并验证分配状态持久化
 * @param taskDetailPage 任务详情页面对象
 * @param expectedAssignee 期望的分配者，null表示未分配
 */
export async function verifyAssignmentPersistence(
  taskDetailPage: TaskDetailPage,
  expectedAssignee: string | null
): Promise<void> {
  // 验证当前分配状态
  await verifyTaskAssignment(taskDetailPage, expectedAssignee);

  // 刷新页面
  await taskDetailPage.refreshAndWait();

  // 验证分配状态在刷新后保持不变
  await verifyTaskAssignment(taskDetailPage, expectedAssignee);
}

/**
 * 检查环境变量是否配置了测试成员邮箱
 * @returns 是否配置了测试成员邮箱
 */
export function isTestMemberEmailConfigured(): boolean {
  const testMemberEmail = process.env.TEST_MEMBER_EMAIL;
  return !!testMemberEmail && testMemberEmail !== "test.member@example.com";
}

/**
 * 获取测试成员邮箱
 * @returns 测试成员邮箱
 * @throws 如果未配置测试成员邮箱
 */
export function getTestMemberEmail(): string {
  const testMemberEmail = process.env.TEST_MEMBER_EMAIL;
  if (!testMemberEmail || testMemberEmail === "test.member@example.com") {
    throw new Error(
      "未配置测试成员邮箱。请在.env文件中设置TEST_MEMBER_EMAIL环境变量。\n" +
        "示例: TEST_MEMBER_EMAIL=test.member@example.com"
    );
  }
  return testMemberEmail;
}

/**
 * 获取测试成员昵称
 * @returns 测试成员昵称
 */
export function getTestMemberName(): string {
  const testMemberName = process.env.TEST_MEMBER_NAME;
  if (!testMemberName) {
    throw new Error(
      "未配置测试成员昵称。请在.env文件中设置TEST_MEMBER_NAME环境变量。\n" +
        "示例: TEST_MEMBER_EMAIL=test"
    );
  }
  return testMemberName;
}
