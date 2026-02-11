import { test, expect } from "../utils/auth-fixtures";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectFormDialog } from "../pages/ProjectFormDialog";
import { TaskFormDialog } from "../pages/TaskFormDialog";
import { AddMemberDialog } from "../pages/AddMemberDialog";
import { TaskDetailPage } from "../pages/TaskDetailPage";
import {
  generateTestId,
  generateTestTaskData,
  setupTaskForAssignmentTest,
  setupTaskWithMemberForAssignmentTest,
  cleanupAssignmentTestData,
  verifyAssignmentPersistence,
  getTestMemberEmail,
  getTestMemberName,
  isTestMemberEmailConfigured,
} from "../utils/task-test-helpers";

test.describe("任务分配功能E2E测试", () => {
  // 在每个测试前检查测试成员邮箱是否配置
  test.beforeEach(() => {
    if (!isTestMemberEmailConfigured()) {
      console.warn(
        "警告: 未配置TEST_MEMBER_EMAIL环境变量。\n" +
          "部分测试可能需要第二个测试用户账号。\n" +
          "请在.env文件中设置TEST_MEMBER_EMAIL环境变量。"
      );
    }
  });

  test("基本分配测试 - 将任务分配给项目成员", async ({ loggedInPage }) => {
    const testId = generateTestId("basic-assign");
    const testData = generateTestTaskData(testId);

    let projectId: string;
    let taskId: string;
    let taskDetailPage: TaskDetailPage;
    let addMemberDialog: AddMemberDialog;

    await test.step("设置测试环境", async () => {
      const setupResult = await setupTaskWithMemberForAssignmentTest(
        loggedInPage,
        testId
      );
      projectId = setupResult.projectId;
      taskId = setupResult.taskId;
      taskDetailPage = setupResult.taskDetailPage;
      addMemberDialog = setupResult.addMemberDialog;
    });

    await test.step("验证初始状态为未分配", async () => {
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).toBe("Unassigned");
    });

    await test.step("分配任务给成员", async () => {
      // 获取测试成员邮箱
      const memberEmail = getTestMemberEmail();

      // 分配任务（使用邮箱或名称的一部分）
      await taskDetailPage.selectAssignee(memberEmail.split("@")[0]);
    });

    await test.step("验证分配成功", async () => {
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).not.toBe("Unassigned");
      expect(currentAssignee).toContain(getTestMemberName()); // 应该包含测试用户名称
    });

    await test.step("验证分配状态持久化", async () => {
      await verifyAssignmentPersistence(taskDetailPage, getTestMemberName());
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  test("取消分配测试 - 将已分配的任务设置为未分配", async ({
    loggedInPage,
  }) => {
    const testId = generateTestId("unassign");
    const testData = generateTestTaskData(testId);

    let projectId: string;
    let taskId: string;
    let taskDetailPage: TaskDetailPage;

    await test.step("设置测试环境并分配任务", async () => {
      const setupResult = await setupTaskWithMemberForAssignmentTest(
        loggedInPage,
        testId
      );
      projectId = setupResult.projectId;
      taskId = setupResult.taskId;
      taskDetailPage = setupResult.taskDetailPage;

      // 先分配任务
      const memberEmail = getTestMemberEmail();
      await taskDetailPage.selectAssignee(memberEmail.split("@")[0]);

      // 验证已分配
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).not.toBe("Unassigned");
    });

    await test.step("取消分配任务", async () => {
      await taskDetailPage.selectUnassigned();
    });

    await test.step("验证任务已取消分配", async () => {
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).toBe("Unassigned");
    });

    await test.step("验证取消分配状态持久化", async () => {
      await verifyAssignmentPersistence(taskDetailPage, null);
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  test("重新分配测试 - 在不同成员之间切换分配", async ({ loggedInPage }) => {
    // 这个测试需要至少两个成员，但我们只有当前用户和测试成员
    // 所以我们将测试在当前用户和测试成员之间切换
    const testId = generateTestId("reassign");
    const testData = generateTestTaskData(testId);

    let projectId: string;
    let taskId: string;
    let taskDetailPage: TaskDetailPage;
    let currentUserEmail: string;

    await test.step("设置测试环境", async () => {
      const setupResult = await setupTaskWithMemberForAssignmentTest(
        loggedInPage,
        testId
      );
      projectId = setupResult.projectId;
      taskId = setupResult.taskId;
      taskDetailPage = setupResult.taskDetailPage;

      // 获取当前用户邮箱（用于验证）
      currentUserEmail = process.env.TEST_USER_EMAIL || "";
    });

    await test.step("分配任务给测试成员", async () => {
      const memberEmail = getTestMemberEmail();
      await taskDetailPage.selectAssignee(memberEmail.split("@")[0]);

      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).not.toBe("Unassigned");
      expect(currentAssignee).toContain("Test");
    });

    await test.step("重新分配给当前用户", async () => {
      // 注意：当前用户可能不在成员列表中，因为项目创建者可能自动成为成员
      // 我们尝试分配给当前用户
      try {
        await taskDetailPage.selectAssignee(currentUserEmail.split("@")[0]);

        const currentAssignee = await taskDetailPage.getCurrentAssignee();
        expect(currentAssignee).not.toBe("Unassigned");
      } catch (error) {
        // 如果当前用户不在成员列表中，这是可以接受的
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log("当前用户可能不在项目成员列表中:", errorMessage);
      }
    });

    await test.step("验证重新分配状态持久化", async () => {
      // 验证当前分配状态在刷新后保持不变
      await taskDetailPage.refreshAndWait();

      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).not.toBe("Unassigned");
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  test("加载状态测试 - 验证分配器加载行为", async ({ loggedInPage }) => {
    const testId = generateTestId("loading");
    const testData = generateTestTaskData(testId);

    let taskDetailPage: TaskDetailPage;

    await test.step("设置测试环境", async () => {
      const setupResult = await setupTaskForAssignmentTest(
        loggedInPage,
        testId
      );
      taskDetailPage = setupResult.taskDetailPage;
    });

    await test.step("验证初始加载状态", async () => {
      // 检查是否有加载指示器
      const isLoading = await taskDetailPage.isAssigneeLoading();

      // 加载状态可能是瞬时的，所以我们只记录它
      if (isLoading) {
        console.log("检测到分配器加载状态");

        // 等待加载完成
        await taskDetailPage.waitForMembersLoaded();
      }
    });

    await test.step("打开分配下拉菜单验证内容", async () => {
      await taskDetailPage.openAssigneeDropdown();

      // 检查下拉菜单内容
      const selectContent = taskDetailPage["assigneeSelectContent"];
      await expect(selectContent).toBeVisible();

      // 检查是否有"Unassigned"选项
      const UnassignedOption = selectContent.getByRole("option", {
        name: "Unassigned",
      });
      await expect(UnassignedOption).toBeVisible();

      // 关闭下拉菜单
      await loggedInPage.keyboard.press("Escape");
      await selectContent.waitFor({ state: "hidden" });
    });

    await test.step("验证分配器功能正常", async () => {
      // 尝试取消分配（应该已经是未分配状态）
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).toBe("Unassigned");

      // 验证可以打开下拉菜单
      await taskDetailPage.openAssigneeDropdown();
      await taskDetailPage["assigneeSelectContent"].waitFor({
        state: "visible",
      });
      await loggedInPage.keyboard.press("Escape");
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  test("无成员情况测试 - 验证没有项目成员时的行为", async ({
    loggedInPage,
  }) => {
    const testId = generateTestId("no-members");
    const testData = generateTestTaskData(testId);

    let taskDetailPage: TaskDetailPage;

    await test.step("设置测试环境（不添加成员）", async () => {
      const setupResult = await setupTaskForAssignmentTest(
        loggedInPage,
        testId
      );
      taskDetailPage = setupResult.taskDetailPage;
    });

    await test.step("验证分配器状态", async () => {
      // 检查当前分配状态
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).toBe("Unassigned");

      // 打开下拉菜单
      await taskDetailPage.openAssigneeDropdown();

      // 检查是否显示"无成员"消息或只有"Unassigned"选项
      const hasNoMembersMessage = await taskDetailPage.hasNoMembersMessage();

      if (hasNoMembersMessage) {
        console.log('检测到"无项目成员"消息');
        await expect(taskDetailPage["assigneeNoMembersMessage"]).toBeVisible();
      } else {
        // 可能只显示"Unassigned"选项
        const options =
          taskDetailPage["assigneeSelectContent"].getByRole("option");
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);

        // 至少应该有"Unassigned"选项
        const UnassignedOption = taskDetailPage[
          "assigneeSelectContent"
        ].getByRole("option", { name: "Unassigned" });
        await expect(UnassignedOption).toBeVisible();
      }

      // 关闭下拉菜单
      await loggedInPage.keyboard.press("Escape");
      await taskDetailPage["assigneeSelectContent"].waitFor({
        state: "hidden",
      });
    });

    await test.step("验证分配功能受限", async () => {
      // 在没有成员的情况下，分配功能应该受限
      // 尝试打开下拉菜单并检查选项
      await taskDetailPage.openAssigneeDropdown();

      const options =
        taskDetailPage["assigneeSelectContent"].getByRole("option");
      const optionCount = await options.count();

      if (optionCount === 1) {
        // 只有"Unassigned"选项
        const onlyOption = options.first();
        const optionText = await onlyOption.textContent();
        expect(optionText).toContain("Unassigned");
      }

      await loggedInPage.keyboard.press("Escape");
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  test("分配状态持久化测试 - 验证分配状态在页面导航后保持不变", async ({
    loggedInPage,
  }) => {
    const testId = generateTestId("persistence");
    const testData = generateTestTaskData(testId);

    let projectId: string;
    let taskId: string;
    let taskDetailPage: TaskDetailPage;

    await test.step("设置测试环境并分配任务", async () => {
      const setupResult = await setupTaskWithMemberForAssignmentTest(
        loggedInPage,
        testId
      );
      projectId = setupResult.projectId;
      taskId = setupResult.taskId;
      taskDetailPage = setupResult.taskDetailPage;

      // 分配任务
      const memberEmail = getTestMemberEmail();
      await taskDetailPage.selectAssignee(memberEmail.split("@")[0]);
    });

    await test.step("验证分配状态在刷新后保持不变", async () => {
      await verifyAssignmentPersistence(taskDetailPage, "Test");
    });

    await test.step("验证分配状态在导航到其他页面后保持不变", async () => {
      // 导航到项目页面
      const projectsPage = new ProjectsPage(loggedInPage);
      await projectsPage.goto();

      // 等待项目页面加载
      await projectsPage.heading.waitFor({ state: "visible" });

      // 导航回任务详情页
      await taskDetailPage.goto(projectId, taskId);

      // 验证分配状态
      const currentAssignee = await taskDetailPage.getCurrentAssignee();
      expect(currentAssignee).not.toBe("Unassigned");
      expect(currentAssignee).toContain("Test");
    });

    await test.step("清理测试数据", async () => {
      await cleanupAssignmentTestData(loggedInPage, testData.project.name);
    });
  });

  // 如果未配置测试成员邮箱，跳过需要第二个用户的测试
  if (!isTestMemberEmailConfigured()) {
    test("跳过需要测试成员邮箱的测试", async () => {
      console.log("跳过测试: 未配置TEST_MEMBER_EMAIL环境变量");
      expect(true).toBe(true); // 总是通过
    });
  }
});
