import { test, expect } from './utils/auth-fixtures';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectFormDialog } from './pages/ProjectFormDialog';

// 测试数据生成函数
const generateTestProjects = (testId: string) => ({
  toDelete: {
    name: `Project to Delete ${testId} ${Date.now()}`,
    description: 'This project will be deleted',
  },
  toKeep: {
    name: `Project to Keep ${testId} ${Date.now()}`,
    description: 'This project will remain',
  },
  multiple: {
    first: {
      name: `First Project ${testId} ${Date.now()}`,
      description: 'First project to delete',
    },
    second: {
      name: `Second Project ${testId} ${Date.now()}`,
      description: 'Second project to delete',
    },
    third: {
      name: `Third Project ${testId} ${Date.now()}`,
      description: 'Third project to keep',
    },
  },
});

test.describe('项目删除流程', () => {
  test('应该能够成功删除项目', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test1');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    await test.step('创建要删除的项目', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toDelete.name,
        testProjects.toDelete.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toDelete.name);
    });

    await test.step('删除项目', async () => {
      await projectsPage.deleteProject(testProjects.toDelete.name);
    });

    await test.step('验证项目已删除', async () => {
      const hasProject = await projectsPage.hasProject(testProjects.toDelete.name);
      expect(hasProject).toBe(false);
    });
  });

  test('应该能够取消删除操作', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test2');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    await test.step('创建要测试的项目', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toKeep.name,
        testProjects.toKeep.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toKeep.name);
    });

    await test.step('开始删除然后取消', async () => {
      await projectsPage.cancelDeleteProject(testProjects.toKeep.name);
    });

    await test.step('验证项目仍然存在', async () => {
      const hasProject = await projectsPage.hasProject(testProjects.toKeep.name);
      expect(hasProject).toBe(true);
    });
  });

  test('应该能够删除多个项目', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test3');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    await test.step('创建多个项目', async () => {
      await projectsPage.goto();

      // 创建第一个项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.multiple.first.name,
        testProjects.multiple.first.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.multiple.first.name);

      // 创建第二个项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.multiple.second.name,
        testProjects.multiple.second.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.multiple.second.name);

      // 创建第三个项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.multiple.third.name,
        testProjects.multiple.third.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.multiple.third.name);
    });

    await test.step('删除第一个项目', async () => {
      await projectsPage.deleteProject(testProjects.multiple.first.name);
    });

    await test.step('验证第一个项目已删除，其他项目仍在', async () => {
      const hasFirstProject = await projectsPage.hasProject(testProjects.multiple.first.name);
      expect(hasFirstProject).toBe(false);

      const hasSecondProject = await projectsPage.hasProject(testProjects.multiple.second.name);
      expect(hasSecondProject).toBe(true);

      const hasThirdProject = await projectsPage.hasProject(testProjects.multiple.third.name);
      expect(hasThirdProject).toBe(true);
    });

    await test.step('删除第二个项目', async () => {
      await projectsPage.deleteProject(testProjects.multiple.second.name);
    });

    await test.step('验证第二个项目已删除，第三个项目仍在', async () => {
      const hasSecondProject = await projectsPage.hasProject(testProjects.multiple.second.name);
      expect(hasSecondProject).toBe(false);

      const hasThirdProject = await projectsPage.hasProject(testProjects.multiple.third.name);
      expect(hasThirdProject).toBe(true);
    });

    await test.step('验证第三个项目仍然存在', async () => {
      const hasThirdProject = await projectsPage.hasProject(testProjects.multiple.third.name);
      expect(hasThirdProject).toBe(true);
    });
  });

  test('应该在删除后保持其他项目不变', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test4');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    let existingProjects: string[] = [];

    await test.step('创建多个项目并记录初始状态', async () => {
      await projectsPage.goto();

      // 获取现有项目
      existingProjects = await projectsPage.getProjectNames();

      // 创建要删除的项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toDelete.name,
        testProjects.toDelete.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toDelete.name);

      // 创建要保留的项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toKeep.name,
        testProjects.toKeep.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toKeep.name);
    });

    await test.step('删除一个项目', async () => {
      await projectsPage.deleteProject(testProjects.toDelete.name);
    });

    await test.step('验证其他项目保持不变', async () => {
      const currentProjects = await projectsPage.getProjectNames();

      // 验证要保留的项目仍然存在
      expect(currentProjects).toContain(testProjects.toKeep.name);

      // 验证要删除的项目已不存在
      expect(currentProjects).not.toContain(testProjects.toDelete.name);

      // 验证原有的项目仍然存在
      for (const existingProject of existingProjects) {
        expect(currentProjects).toContain(existingProject);
      }
    });
  });

  test('应该处理删除最后一个项目的情况', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test5');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    await test.step('创建最后一个项目', async () => {
      await projectsPage.goto();

      // 创建项目
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toDelete.name,
        testProjects.toDelete.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toDelete.name);

      const hasProject = await projectsPage.hasProject(testProjects.toDelete.name);
      expect(hasProject).toBe(true);
    });

    await test.step('删除项目', async () => {
      await projectsPage.deleteProject(testProjects.toDelete.name);
    });

    await test.step('验证项目已删除', async () => {
      const hasProject = await projectsPage.hasProject(testProjects.toDelete.name);
      expect(hasProject).toBe(false);
    });
  });

  test('应该验证删除确认对话框的内容', async ({
    loggedInPage
  }) => {
    // 生成唯一的测试数据
    const testProjects = generateTestProjects('test6');

    // 从已登录的页面创建POM对象
    const projectsPage = new ProjectsPage(loggedInPage);
    const projectFormDialog = new ProjectFormDialog(loggedInPage);

    await test.step('创建要删除的项目', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(
        testProjects.toDelete.name,
        testProjects.toDelete.description
      );
      await projectsPage.waitForProjectToAppear(testProjects.toDelete.name);
    });

    await test.step('打开删除确认对话框', async () => {
      await projectsPage.openProjectMenu(testProjects.toDelete.name);
      await loggedInPage.getByRole("menuitem", { name: "Delete" }).click();
    });

    await test.step('验证对话框内容', async () => {
      const deleteDialog = loggedInPage.getByRole("dialog");

      // 验证标题
      await expect(deleteDialog.getByRole("heading", { name: "Delete Project" })).toBeVisible();

      // 验证描述包含项目名称
      const description = deleteDialog.getByRole("paragraph");
      await expect(description).toContainText(testProjects.toDelete.name);
      await expect(description).toContainText("This will also delete all tasks, todos, and notes");
      await expect(description).toContainText("This action cannot be undone");

      // 验证按钮
      await expect(deleteDialog.getByRole("button", { name: "Cancel" })).toBeVisible();
      await expect(deleteDialog.getByRole("button", { name: "Delete" })).toBeVisible();
    });

    await test.step('取消删除', async () => {
      await loggedInPage.getByRole("button", { name: "Cancel" }).click();
      await loggedInPage.getByRole("dialog").waitFor({ state: "hidden" });
    });
  });
});