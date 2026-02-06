import { Page, Locator, expect } from "@playwright/test";

export class TaskDetailPage {
  readonly page: Page;
  readonly assigneeLabel: Locator;
  readonly assigneeSelectTrigger: Locator;
  readonly assigneeSelectContent: Locator;
  readonly assigneeLoadingIndicator: Locator;
  readonly assigneeNoMembersMessage: Locator;
  readonly taskTitle: Locator;
  readonly taskDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    // Assignee相关选择器
    this.assigneeLabel = page.getByText("Assignee", { exact: true }).or(
      page.locator('label:has-text("Assignee")')
    );
    this.assigneeSelectTrigger = page.getByRole("combobox", { name: "Assignee" }).or(
      page.locator('[role="combobox"]', { hasText: "unassigned" })
    );
    this.assigneeSelectContent = page.getByRole("listbox");
    this.assigneeLoadingIndicator = page.locator('svg[class*="animate-spin"]');
    this.assigneeNoMembersMessage = page.locator('text=No project members found');

    // 任务基本信息
    this.taskTitle = page.getByRole("heading", { level: 1 });
    this.taskDescription = page.locator('[data-testid="task-description"]').or(
      page.locator('div[contenteditable="true"]')
    );
  }

  /**
   * 导航到任务详情页
   * @param projectId 项目ID
   * @param taskId 任务ID
   */
  async goto(projectId: string, taskId: string): Promise<void> {
    await this.page.goto(`/project/${projectId}/task/${taskId}`);
    await this.page.waitForURL(`**/project/${projectId}/task/${taskId}`);
    await this.taskTitle.waitFor({ state: "visible" });
  }

  /**
   * 获取当前分配者信息
   * @returns 当前分配者名称或"Unassigned"
   */
  async getCurrentAssignee(): Promise<string> {
    const assigneeTrigger = this.assigneeSelectTrigger;
    const text = await assigneeTrigger.textContent();
    if (!text || text.includes("Unassigned")) {
      return "Unassigned";
    }
    // 提取用户名称（可能包含头像和名称）
    return text.trim();
  }

  /**
   * 打开分配者下拉菜单
   */
  async openAssigneeDropdown(): Promise<void> {
    await this.assigneeSelectTrigger.click();
    await this.assigneeSelectContent.waitFor({ state: "visible" });
  }

  /**
   * 选择分配者
   * @param memberName 成员名称或邮箱
   */
  async selectAssignee(memberName: string): Promise<void> {
    await this.openAssigneeDropdown();

    // 等待选项加载完成
    await this.page.waitForTimeout(500);

    // 查找匹配的选项
    const option = this.assigneeSelectContent.getByRole("option", {
      name: new RegExp(memberName, "i")
    }).or(
      this.assigneeSelectContent.locator(`text=${memberName}`)
    );

    await expect(option).toBeVisible();
    await option.click();

    // 等待下拉菜单关闭
    await this.assigneeSelectContent.waitFor({ state: "hidden" });

    // 等待分配状态更新
    await this.waitForAssigneeUpdate(memberName);
  }

  /**
   * 取消分配（选择未分配）
   */
  async selectUnassigned(): Promise<void> {
    await this.openAssigneeDropdown();

    const unassignedOption = this.assigneeSelectContent.getByRole("option", {
      name: "Unassigned"
    }).or(
      this.assigneeSelectContent.locator('text=Unassigned')
    );

    await expect(unassignedOption).toBeVisible();
    await unassignedOption.click();

    // 等待下拉菜单关闭
    await this.assigneeSelectContent.waitFor({ state: "hidden" });

    // 等待分配状态更新
    await this.waitForAssigneeUpdate(null);
  }

  /**
   * 等待分配状态更新
   * @param expectedAssignee 期望的分配者名称，null表示未分配
   */
  async waitForAssigneeUpdate(expectedAssignee: string | null): Promise<void> {
    if (expectedAssignee === null) {
      // 等待显示"Unassigned"
      await expect(this.assigneeSelectTrigger).toContainText("Unassigned");
    } else {
      // 等待显示指定的分配者
      await expect(this.assigneeSelectTrigger).toContainText(expectedAssignee);
    }
  }

  /**
   * 获取可用成员列表
   * @returns 成员名称数组
   */
  async getAvailableMembers(): Promise<string[]> {
    await this.openAssigneeDropdown();

    // 等待选项加载
    await this.page.waitForTimeout(500);

    const options = this.assigneeSelectContent.getByRole("option");
    const count = await options.count();
    const members: string[] = [];

    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const text = await option.textContent();
      if (text && !text.includes("unassigned") && !text.includes("Loading")) {
        members.push(text.trim());
      }
    }

    // 关闭下拉菜单
    await this.page.keyboard.press("Escape");
    await this.assigneeSelectContent.waitFor({ state: "hidden" });

    return members;
  }

  /**
   * 检查是否正在加载成员
   * @returns 是否正在加载
   */
  async isAssigneeLoading(): Promise<boolean> {
    return await this.assigneeLoadingIndicator.isVisible();
  }

  /**
   * 等待成员加载完成
   */
  async waitForMembersLoaded(): Promise<void> {
    // 等待加载指示器消失
    await this.assigneeLoadingIndicator.waitFor({ state: "hidden" });

    // 打开下拉菜单检查内容
    await this.openAssigneeDropdown();

    // 检查是否有"Loading members..."消息
    const loadingMessage = this.assigneeSelectContent.locator('text=Loading members...');
    if (await loadingMessage.isVisible()) {
      await loadingMessage.waitFor({ state: "hidden" });
    }

    // 关闭下拉菜单
    await this.page.keyboard.press("Escape");
    await this.assigneeSelectContent.waitFor({ state: "hidden" });
  }

  /**
   * 检查是否显示无成员消息
   * @returns 是否显示无成员消息
   */
  async hasNoMembersMessage(): Promise<boolean> {
    await this.openAssigneeDropdown();
    const hasMessage = await this.assigneeNoMembersMessage.isVisible();

    // 关闭下拉菜单
    await this.page.keyboard.press("Escape");
    await this.assigneeSelectContent.waitFor({ state: "hidden" });

    return hasMessage;
  }

  /**
   * 刷新页面并等待加载完成
   */
  async refreshAndWait(): Promise<void> {
    await this.page.reload();
    await this.taskTitle.waitFor({ state: "visible" });
    await this.assigneeSelectTrigger.waitFor({ state: "visible" });
  }

  /**
   * 获取任务标题
   * @returns 任务标题
   */
  async getTaskTitle(): Promise<string> {
    const title = await this.taskTitle.textContent();
    return title?.trim() || "";
  }

  /**
   * 获取任务描述
   * @returns 任务描述
   */
  async getTaskDescription(): Promise<string> {
    if (await this.taskDescription.isVisible()) {
      const description = await this.taskDescription.textContent();
      return description?.trim() || "";
    }
    return "";
  }
}