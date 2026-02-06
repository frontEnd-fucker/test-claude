import { Page, Locator } from "@playwright/test";

export class TaskFormDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly prioritySelectTrigger: Locator;
  readonly prioritySelectContent: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");

    // 表单字段
    this.titleInput = page
      .getByLabel("Title")
      .or(page.getByPlaceholder("Task title"));
    this.descriptionInput = page
      .getByLabel("Description")
      .or(page.getByPlaceholder("Task description"));
    this.prioritySelectTrigger = page
      .getByRole("combobox", { name: "Priority" })
      .or(
        page.locator('[role="combobox"]', {
          hasText: /Priority|Not set|Low|Medium|High/i,
        })
      );
    this.prioritySelectContent = page.getByRole("listbox");

    // 按钮
    this.createButton = page.getByRole("button", {
      name: /Create Task|Add Task|Save/i,
    });
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
    this.closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has(svg[aria-label="Close"])'));
  }

  /**
   * 等待对话框打开
   */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * 等待对话框关闭
   */
  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden" });
  }

  /**
   * 打开任务创建对话框
   * @param triggerSelector 触发按钮的选择器（可选）
   */
  async open(triggerSelector?: string): Promise<void> {
    if (triggerSelector) {
      await this.page.locator(triggerSelector).click();
    } else {
      // 默认使用"Add Task"按钮
      const addTaskButton = this.page
        .getByRole("button", { name: /Add Task|New Task/i })
        .first();
      await addTaskButton.click();
    }
    await this.waitForOpen();
  }

  /**
   * 填写任务表单
   * @param title 任务标题
   * @param description 任务描述（可选）
   * @param priority 优先级（可选）
   */
  async fillForm(
    title: string,
    description?: string,
    priority?: "low" | "medium" | "high"
  ): Promise<void> {
    // 填写标题
    await this.titleInput.fill(title);

    // 填写描述（如果提供）
    if (description) {
      await this.descriptionInput.fill(description);
    }

    // 选择优先级（如果提供）
    if (priority) {
      await this.selectPriority(priority);
    }
  }

  /**
   * 选择优先级
   * @param priority 优先级
   */
  async selectPriority(priority: "low" | "medium" | "high"): Promise<void> {
    await this.prioritySelectTrigger.click();
    await this.prioritySelectContent.waitFor({ state: "visible" });

    const priorityOption = this.prioritySelectContent
      .getByRole("option", {
        name: new RegExp(priority, "i"),
      })
      .or(
        this.prioritySelectContent.locator(
          `text=${priority.charAt(0).toUpperCase() + priority.slice(1)}`
        )
      );

    await priorityOption.click();
    await this.prioritySelectContent.waitFor({ state: "hidden" });
  }

  /**
   * 创建任务
   * @param title 任务标题
   * @param description 任务描述（可选）
   * @param priority 优先级（可选）
   */
  async createTask(
    title: string,
    description?: string,
    priority?: "low" | "medium" | "high"
  ): Promise<void> {
    await this.fillForm(title, description, priority);
    await this.createButton.click();
    await this.waitForClose();
  }

  /**
   * 取消创建任务
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  /**
   * 关闭对话框
   */
  async close(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await this.closeButton.click();
    } else {
      // 按ESC键关闭
      await this.page.keyboard.press("Escape");
    }
    await this.waitForClose();
  }

  /**
   * 获取表单标题
   * @returns 对话框标题
   */
  async getDialogTitle(): Promise<string> {
    const title = this.dialog.getByRole("heading");
    if (await title.isVisible()) {
      const text = await title.textContent();
      return text?.trim() || "";
    }
    return "";
  }

  /**
   * 检查表单是否有效
   * @returns 表单是否有效
   */
  async isFormValid(): Promise<boolean> {
    // 检查标题是否已填写
    const titleValue = await this.titleInput.inputValue();
    if (!titleValue.trim()) {
      return false;
    }

    // 检查创建按钮是否可用
    const isCreateButtonEnabled = await this.createButton.isEnabled();
    return isCreateButtonEnabled;
  }

  /**
   * 清空表单
   */
  async clearForm(): Promise<void> {
    await this.titleInput.clear();
    await this.descriptionInput.clear();

    // 重置优先级（如果已选择）
    if (await this.prioritySelectTrigger.isVisible()) {
      const triggerText = await this.prioritySelectTrigger.textContent();
      if (triggerText && !triggerText.includes("Not set")) {
        await this.selectPriority("medium"); // 重置为默认值
      }
    }
  }
}
