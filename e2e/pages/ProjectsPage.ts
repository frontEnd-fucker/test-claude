import { Page, Locator } from "@playwright/test";

export class ProjectsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newProjectButton: Locator;
  readonly createFirstProjectButton: Locator;
  readonly projectCards: Locator;
  readonly emptyState: Locator;
  readonly projectFormDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Projects" });
    this.newProjectButton = page.getByRole("button", { name: /new project/i });
    this.createFirstProjectButton = page.getByRole("button", {
      name: /create first project/i,
    });
    this.projectCards = page.locator('[data-testid="project-card"]');
    this.emptyState = page.locator("text=No projects yet");
    this.projectFormDialog = page.getByRole("dialog");
  }

  async goto() {
    await this.page.goto("/projects");
    await this.heading.waitFor({ state: "visible" });
  }

  async openNewProjectDialog() {
    // 尝试找到"New Project"按钮，如果找不到则使用"Create First Project"按钮
    if (await this.newProjectButton.isVisible()) {
      await this.newProjectButton.click();
    } else if (await this.createFirstProjectButton.isVisible()) {
      await this.createFirstProjectButton.click();
    } else {
      throw new Error("Could not find new project button");
    }
    await this.projectFormDialog.waitFor({ state: "visible" });
  }

  async getProjectCount(): Promise<number> {
    return await this.projectCards.count();
  }

  async getProjectNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.getProjectCount();
    for (let i = 0; i < count; i++) {
      const card = this.projectCards.nth(i);
      const name = await card
        .getByTestId("card-title")
        .textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async hasProject(name: string): Promise<boolean> {
    const names = await this.getProjectNames();
    return names.some((projectName) => projectName.includes(name));
  }

  async waitForProjectToAppear(name: string, timeout = 5000) {
    const cardLocator = this.page.locator('[data-testid="project-card"]', {
      hasText: name,
    });
    await cardLocator.waitFor({ state: "visible", timeout });
  }

  async waitForProjectToDisappear(name: string, timeout = 5000) {
    const cardLocator = this.page.locator('[data-testid="project-card"]', {
      hasText: name,
    });
    await cardLocator.waitFor({ state: "hidden", timeout });
  }

  async getProjectCardByName(name: string): Promise<Locator> {
    return this.page.locator('[data-testid="project-card"]', {
      hasText: name,
    });
  }

  async openProjectMenu(projectName: string) {
    const projectCard = await this.getProjectCardByName(projectName);

    // 悬停在项目卡片上以显示菜单按钮
    await projectCard.hover();

    // 等待菜单按钮出现（通过data-testid定位）
    const menuButton = projectCard.getByTestId('project-card-menu-button');
    await menuButton.waitFor({ state: "visible" });

    // 点击菜单按钮
    await menuButton.click();

    // 等待菜单打开
    await this.page.getByRole("menu").waitFor({ state: "visible" });
  }

  async deleteProject(projectName: string) {
    await this.openProjectMenu(projectName);

    // 点击删除菜单项
    await this.page.getByRole("menuitem", { name: "Delete" }).click();

    // 等待删除确认对话框出现
    const deleteDialog = this.page.getByRole("dialog");
    await deleteDialog.waitFor({ state: "visible" });

    // 确认删除
    await this.page.getByRole("button", { name: "Delete" }).click();

    // 等待删除完成
    await this.waitForProjectToDisappear(projectName);
  }

  async cancelDeleteProject(projectName: string) {
    await this.openProjectMenu(projectName);

    // 点击删除菜单项
    await this.page.getByRole("menuitem", { name: "Delete" }).click();

    // 等待删除确认对话框出现
    const deleteDialog = this.page.getByRole("dialog");
    await deleteDialog.waitFor({ state: "visible" });

    // 取消删除
    await this.page.getByRole("button", { name: "Cancel" }).click();

    // 等待对话框关闭
    await deleteDialog.waitFor({ state: "hidden" });
  }
}
