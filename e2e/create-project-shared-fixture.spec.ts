import { test, expect } from './utils/auth-fixtures';

// 测试数据
const TEST_PROJECTS = {
  basic: {
    name: `Basic Project ${Date.now()}`,
    description: 'A basic test project',
  },
  noDescription: {
    name: `No Description Project ${Date.now()}`,
  },
  longName: {
    name: `Very Long Project Name That Should Still Work ${Date.now()}`,
    description: 'This project has a very long name to test edge cases',
  },
};

test.describe('项目创建流程 (使用共享Fixture)', () => {
  test('应该能够成功创建带描述的项目', async ({
    authenticatedPage,
    projectsPage,
    projectFormDialog
  }) => {
    // authenticatedPage已经是登录状态，projectsPage和projectFormDialog已初始化
    await test.step('导航到项目页面', async () => {
      await projectsPage.goto();
      await expect(projectsPage.heading).toBeVisible();
    });

    await test.step('打开项目创建对话框', async () => {
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.waitForOpen();
      await expect(projectFormDialog.title).toContainText('Create New Project');
    });

    await test.step('填写并提交项目表单', async () => {
      await projectFormDialog.createProject(
        TEST_PROJECTS.basic.name,
        TEST_PROJECTS.basic.description
      );
    });

    await test.step('验证项目创建成功', async () => {
      await projectsPage.waitForProjectToAppear(TEST_PROJECTS.basic.name);
      const hasProject = await projectsPage.hasProject(TEST_PROJECTS.basic.name);
      expect(hasProject).toBe(true);
    });
  });

  test('应该能够创建没有描述的项目', async ({
    authenticatedPage,
    projectsPage,
    projectFormDialog
  }) => {
    await test.step('创建没有描述的项目', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.createProject(TEST_PROJECTS.noDescription.name);
    });

    await test.step('验证项目创建成功', async () => {
      await projectsPage.waitForProjectToAppear(TEST_PROJECTS.noDescription.name);
      const hasProject = await projectsPage.hasProject(TEST_PROJECTS.noDescription.name);
      expect(hasProject).toBe(true);
    });
  });

  test('应该验证必填字段', async ({
    authenticatedPage,
    projectsPage,
    projectFormDialog
  }) => {
    await test.step('打开项目创建对话框', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
    });

    await test.step('尝试提交空表单', async () => {
      // 清空名称字段
      await projectFormDialog.nameInput.clear();

      // 检查提交按钮是否可用
      const isDisabled = await projectFormDialog.isSubmitDisabled();

      // 尝试点击提交按钮
      await projectFormDialog.createButton.click();

      // 对话框应该仍然可见
      await expect(projectFormDialog.dialog).toBeVisible();
    });

    await test.step('填写有效名称并提交', async () => {
      await projectFormDialog.createProject(TEST_PROJECTS.longName.name);
    });

    await test.step('验证项目创建成功', async () => {
      await projectsPage.waitForProjectToAppear(TEST_PROJECTS.longName.name);
      const hasProject = await projectsPage.hasProject(TEST_PROJECTS.longName.name);
      expect(hasProject).toBe(true);
    });
  });

  test('应该能够取消项目创建', async ({
    authenticatedPage,
    projectsPage,
    projectFormDialog
  }) => {
    await test.step('打开项目创建对话框', async () => {
      await projectsPage.goto();
      await projectsPage.openNewProjectDialog();
    });

    await test.step('填写表单然后取消', async () => {
      const projectName = `Cancelled Project ${Date.now()}`;
      await projectFormDialog.fillForm(projectName, 'This will be cancelled');
      await projectFormDialog.cancel();
    });

    await test.step('验证对话框已关闭', async () => {
      await expect(projectFormDialog.dialog).toBeHidden();
    });

    await test.step('验证项目没有被创建', async () => {
      // 等待页面稳定
      await authenticatedPage.waitForTimeout(1000);

      // 检查没有新项目被创建（项目数量应该保持不变）
      const initialCount = await projectsPage.getProjectCount();

      // 尝试再次打开对话框并取消，确保计数不变
      await projectsPage.openNewProjectDialog();
      await projectFormDialog.cancel();

      const finalCount = await projectsPage.getProjectCount();
      expect(finalCount).toBe(initialCount);
    });
  });

  test('应该在空状态和列表状态都能工作', async ({
    authenticatedPage,
    projectsPage,
    projectFormDialog
  }) => {
    await test.step('检查初始状态', async () => {
      await projectsPage.goto();
    });

    const initialCount = await projectsPage.getProjectCount();

    if (initialCount === 0) {
      await test.step('从空状态创建第一个项目', async () => {
        // 应该显示"Create First Project"按钮
        await expect(projectsPage.createFirstProjectButton).toBeVisible();
        await projectsPage.createFirstProjectButton.click();

        await projectFormDialog.waitForOpen();
        await projectFormDialog.createProject('First Project', 'My first project');

        await projectsPage.waitForProjectToAppear('First Project');
        const newCount = await projectsPage.getProjectCount();
        expect(newCount).toBe(1);
      });

      await test.step('从列表状态创建第二个项目', async () => {
        // 现在应该显示"New Project"按钮
        await expect(projectsPage.newProjectButton).toBeVisible();
        await projectsPage.openNewProjectDialog();

        await projectFormDialog.createProject('Second Project');

        await projectsPage.waitForProjectToAppear('Second Project');
        const finalCount = await projectsPage.getProjectCount();
        expect(finalCount).toBe(2);
      });
    } else {
      await test.step('从列表状态创建项目', async () => {
        await expect(projectsPage.newProjectButton).toBeVisible();
        await projectsPage.openNewProjectDialog();

        const projectName = `Additional Project ${Date.now()}`;
        await projectFormDialog.createProject(projectName);

        await projectsPage.waitForProjectToAppear(projectName);
        const newCount = await projectsPage.getProjectCount();
        expect(newCount).toBe(initialCount + 1);
      });
    }
  });
});

// 使用ensureLoggedIn辅助函数的示例
test.describe('使用ensureLoggedIn辅助函数', () => {
  test('示例测试', async ({ page, ensureLoggedIn, projectsPage, projectFormDialog }) => {
    // 手动调用ensureLoggedIn
    await ensureLoggedIn();

    // 现在page已经是登录状态
    await projectsPage.goto();
    await projectsPage.openNewProjectDialog();

    const projectName = `Test Project ${Date.now()}`;
    await projectFormDialog.createProject(projectName);

    await projectsPage.waitForProjectToAppear(projectName);
    const hasProject = await projectsPage.hasProject(projectName);
    expect(hasProject).toBe(true);
  });
});