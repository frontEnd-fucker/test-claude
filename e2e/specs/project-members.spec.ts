import { test, expect } from "../utils/auth-fixtures";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { AddMemberDialog } from "../pages/AddMemberDialog";
import {
  generateTestId,
  generateTestMemberData,
  setupProjectForMemberTest,
  addTestMemberToProject,
  verifyMemberAdded,
  verifyMemberRemoved,
  cleanupMemberTestData,
  getTestMemberEmail,
  isTestMemberEmailConfigured,
} from "../utils/member-test-helpers";

test.describe("项目成员管理E2E测试", () => {
  // 在每个测试前检查测试成员邮箱是否配置
  test.beforeEach(() => {
    if (!isTestMemberEmailConfigured()) {
      console.warn(
        "警告: 未配置TEST_MEMBER_EMAIL环境变量。\n" +
          "成员管理测试需要第二个测试用户账号。\n" +
          "请在.env文件中设置TEST_MEMBER_EMAIL环境变量。"
      );
    }
  });

  test("成功添加新成员（通过邮箱邀请）", async ({ loggedInPage }) => {
    const testId = generateTestId("add-member");
    const testData = generateTestMemberData(testId);

    let projectId: string;
    let projectDetailPage: ProjectDetailPage;
    let addMemberDialog: AddMemberDialog;

    await test.step("设置测试环境", async () => {
      const setupResult = await setupProjectForMemberTest(loggedInPage, testId);
      projectId = setupResult.projectId;
      projectDetailPage = setupResult.projectDetailPage;
    });

    await test.step("验证初始状态", async () => {
      // 验证项目详情页加载成功
      const projectTitle = await projectDetailPage.getProjectTitle();
      expect(projectTitle).toBe(testData.project.name);

      // 验证初始成员数量（应该只有项目所有者）
      const initialCount = await projectDetailPage.getMemberCount();
      expect(initialCount).toBe(1); // 只有项目所有者

      // 验证添加成员按钮可见
      const hasAddButton = await projectDetailPage.hasAddMemberButton();
      expect(hasAddButton).toBe(true);
    });

    await test.step("打开添加成员对话框", async () => {
      addMemberDialog = await projectDetailPage.openAddMemberDialog();

      // 验证对话框打开
      const dialogTitle = await addMemberDialog.getDialogTitle();
      expect(dialogTitle).toMatch(/Add Member|Invite Member/i);
    });

    await test.step("填写成员信息并添加", async () => {
      const memberEmail = getTestMemberEmail();

      // 填写邮箱
      await addMemberDialog.fillEmail(memberEmail);

      // 选择角色（可选，默认为member）
      await addMemberDialog.selectRole("member");

      // 点击添加按钮
      await addMemberDialog.addButton.click();

      // 等待操作完成
      await loggedInPage.waitForTimeout(1000);
    });

    await test.step("验证添加成功", async () => {
      // 验证成功消息（如果显示）
      if (await addMemberDialog.hasSuccessMessage()) {
        const successMessage = await addMemberDialog.getSuccessMessage();
        expect(successMessage).toMatch(/successfully|added/i);
      }

      // 验证对话框关闭
      await addMemberDialog.waitForClose();

      // 验证成员添加成功
      const memberEmail = getTestMemberEmail();
      await verifyMemberAdded(projectDetailPage, memberEmail);

      // 验证成员数量增加
      const newCount = await projectDetailPage.getMemberCount();
      expect(newCount).toBe(2); // 项目所有者 + 新成员
    });

    await test.step("清理测试数据", async () => {
      await cleanupMemberTestData(loggedInPage, testData.project.name);
    });
  });

  test("成功删除成员", async ({ loggedInPage }) => {
    const testId = generateTestId("remove-member");
    const testData = generateTestMemberData(testId);

    let projectId: string;
    let projectDetailPage: ProjectDetailPage;
    let initialMemberCount: number;

    await test.step("设置测试环境并添加成员", async () => {
      const setupResult = await setupProjectForMemberTest(loggedInPage, testId);
      projectId = setupResult.projectId;
      projectDetailPage = setupResult.projectDetailPage;

      // 获取初始成员数量
      initialMemberCount = await projectDetailPage.getMemberCount();
      expect(initialMemberCount).toBe(1); // 只有项目所有者

      // 添加测试成员
      const memberEmail = getTestMemberEmail();
      await addTestMemberToProject(loggedInPage, projectId, memberEmail, "member");

      // 验证成员已添加
      await verifyMemberAdded(projectDetailPage, memberEmail);

      // 刷新页面确保状态同步
      await projectDetailPage.refresh();

      // 验证添加后的成员数量
      const countAfterAdd = await projectDetailPage.getMemberCount();
      expect(countAfterAdd).toBe(2); // 项目所有者 + 新成员
    });

    await test.step("删除成员", async () => {
      const memberEmail = getTestMemberEmail();

      // 获取删除前的成员数量
      const countBeforeRemove = await projectDetailPage.getMemberCount();

      // 删除成员
      await projectDetailPage.removeMember(memberEmail);

      // 等待成员被移除
      await loggedInPage.waitForTimeout(1000);
    });

    await test.step("验证删除成功", async () => {
      const memberEmail = getTestMemberEmail();

      // 验证成员删除成功
      await verifyMemberRemoved(projectDetailPage, memberEmail, 2);

      // 验证成员数量减少
      const countAfterRemove = await projectDetailPage.getMemberCount();
      expect(countAfterRemove).toBe(1); // 只剩下项目所有者
    });

    await test.step("验证删除状态持久化", async () => {
      // 刷新页面
      await projectDetailPage.refresh();

      // 验证成员仍然不存在
      const memberEmail = getTestMemberEmail();
      const hasMember = await projectDetailPage.hasMember(memberEmail);
      expect(hasMember).toBe(false);

      // 验证成员数量保持不变
      const countAfterRefresh = await projectDetailPage.getMemberCount();
      expect(countAfterRefresh).toBe(1);
    });

    await test.step("清理测试数据", async () => {
      await cleanupMemberTestData(loggedInPage, testData.project.name);
    });
  });

  test("添加和删除成员的完整流程", async ({ loggedInPage }) => {
    const testId = generateTestId("full-flow");
    const testData = generateTestMemberData(testId);

    let projectId: string;
    let projectDetailPage: ProjectDetailPage;

    await test.step("设置测试环境", async () => {
      const setupResult = await setupProjectForMemberTest(loggedInPage, testId);
      projectId = setupResult.projectId;
      projectDetailPage = setupResult.projectDetailPage;

      // 验证初始状态
      const initialCount = await projectDetailPage.getMemberCount();
      expect(initialCount).toBe(1); // 只有项目所有者
    });

    await test.step("第一步：添加成员", async () => {
      const memberEmail = getTestMemberEmail();

      // 添加成员
      await addTestMemberToProject(loggedInPage, projectId, memberEmail, "member");

      // 验证添加成功
      await verifyMemberAdded(projectDetailPage, memberEmail);

      // 验证成员数量
      const countAfterAdd = await projectDetailPage.getMemberCount();
      expect(countAfterAdd).toBe(2);
    });

    await test.step("第二步：删除成员", async () => {
      const memberEmail = getTestMemberEmail();

      // 删除成员
      await projectDetailPage.removeMember(memberEmail);

      // 验证删除成功
      await verifyMemberRemoved(projectDetailPage, memberEmail, 2);

      // 验证成员数量
      const countAfterRemove = await projectDetailPage.getMemberCount();
      expect(countAfterRemove).toBe(1);
    });

    await test.step("第三步：重新添加成员", async () => {
      const memberEmail = getTestMemberEmail();

      // 重新添加成员
      await addTestMemberToProject(loggedInPage, projectId, memberEmail, "member");

      // 验证重新添加成功
      await verifyMemberAdded(projectDetailPage, memberEmail);

      // 验证成员数量
      const countAfterReAdd = await projectDetailPage.getMemberCount();
      expect(countAfterReAdd).toBe(2);
    });

    await test.step("第四步：验证完整流程", async () => {
      // 刷新页面验证状态持久化
      await projectDetailPage.refresh();

      // 验证成员存在
      const memberEmail = getTestMemberEmail();
      const hasMember = await projectDetailPage.hasMember(memberEmail);
      expect(hasMember).toBe(true);

      // 验证成员数量
      const finalCount = await projectDetailPage.getMemberCount();
      expect(finalCount).toBe(2);

      // 验证项目信息
      const projectTitle = await projectDetailPage.getProjectTitle();
      expect(projectTitle).toBe(testData.project.name);
    });

    await test.step("清理测试数据", async () => {
      await cleanupMemberTestData(loggedInPage, testData.project.name);
    });
  });

  // 当未配置测试成员邮箱时跳过相关测试
  if (!isTestMemberEmailConfigured()) {
    test.skip("成功添加新成员（通过邮箱邀请）", () => {});
    test.skip("成功删除成员", () => {});
    test.skip("添加和删除成员的完整流程", () => {});
  }
});