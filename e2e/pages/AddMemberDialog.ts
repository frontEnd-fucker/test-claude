import { Page, Locator, expect } from "@playwright/test";

export class AddMemberDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly emailInput: Locator;
  readonly searchResults: Locator;
  readonly roleSelectTrigger: Locator;
  readonly roleSelectContent: Locator;
  readonly addButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");

    // 表单字段
    this.emailInput = page
      .getByLabel("Email")
      .or(page.getByPlaceholder("Enter email address"));
    this.searchResults = page
      .locator('[data-testid="user-search-result"]')
      .or(page.locator('div[role="option"]'));
    this.roleSelectTrigger = page.getByRole("combobox", { name: "Role" }).or(
      page.locator('[role="combobox"]', {
        hasText: /Role|Member|Admin|Viewer/i,
      })
    );
    this.roleSelectContent = page.getByRole("listbox");

    // 按钮
    this.addButton = page.getByRole("button", {
      name: /Add Member|Invite|Send Invitation/i,
    });
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
    this.closeButton = page
      .locator('button[aria-label="Close"]')
      .or(page.locator('button:has(svg[aria-label="Close"])'));

    // 消息
    this.successMessage = page.locator("text=Member added successfully");
    this.errorMessage = page
      .locator("text=Failed to add member")
      .or(page.locator('[role="alert"]'));
    this.loadingIndicator = page.locator('svg[class*="animate-spin"]');
  }

  /**
   * 等待对话框打开
   */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
    // await this.emailInput.waitFor({ state: "visible" });
  }

  /**
   * 等待对话框关闭
   */
  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden" });
  }

  /**
   * 打开添加成员对话框
   * @param triggerSelector 触发按钮的选择器（可选）
   */
  async open(triggerSelector?: string): Promise<void> {
    if (triggerSelector) {
      await this.page.locator(triggerSelector).click();
    } else {
      // 默认使用"Add Member"按钮
      const addMemberButton = this.page
        .getByRole("button", { name: /Add Member|Invite Member/i })
        .first();
      await addMemberButton.click();
    }
    await this.waitForOpen();
  }

  /**
   * 填写邮箱地址
   * @param email 邮箱地址
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    // 等待搜索完成
    await this.page.waitForTimeout(1000);
  }

  /**
   * 搜索并选择用户
   * @param email 用户邮箱
   * @param userName 用户名称（可选）
   */
  async searchAndSelectUser(email: string, userName?: string): Promise<void> {
    await this.fillEmail(email);

    // 暂时先不用下拉选择

    // 等待搜索结果出现
    // await this.searchResults
    //   .first()
    //   .waitFor({ state: "visible", timeout: 5000 });

    // 查找匹配的用户
    // const userResult = this.searchResults.filter({ hasText: email }).or(
    //   userName ? this.searchResults.filter({ hasText: userName }) : this.searchResults.first()
    // );

    // await expect(userResult).toBeVisible();
    // await userResult.click();

    // // 验证用户已选中
    // const selectedEmail = await this.emailInput.inputValue();
    // expect(selectedEmail).toBe(email);
  }

  /**
   * 选择角色
   * @param role 角色
   */
  async selectRole(role: "member" | "admin" | "viewer"): Promise<void> {
    await this.roleSelectTrigger.click();
    await this.roleSelectContent.waitFor({ state: "visible" });

    const roleOption = this.roleSelectContent
      .getByRole("option", {
        name: new RegExp(role, "i"),
      })
      .or(
        this.roleSelectContent.locator(
          `text=${role.charAt(0).toUpperCase() + role.slice(1)}`
        )
      );

    await roleOption.click();
    await this.roleSelectContent.waitFor({ state: "hidden" });
  }

  /**
   * 添加成员
   * @param email 邮箱地址
   * @param role 角色（可选，默认为"member"）
   */
  async addMemberByEmail(
    email: string,
    role: "member" | "admin" | "viewer" = "member"
  ): Promise<void> {
    await this.fillEmail(email);

    // 如果提供了角色且不是默认值，选择角色
    if (role !== "member") {
      await this.selectRole(role);
    }

    await this.addButton.click();

    // 等待操作完成
    await this.page.waitForTimeout(1000);

    // 检查是否成功（可能显示成功消息或直接关闭对话框）
    if (await this.successMessage.isVisible()) {
      await this.successMessage.waitFor({ state: "hidden" });
    }

    await this.waitForClose();
  }

  /**
   * 添加已存在的用户
   * @param email 用户邮箱
   * @param userName 用户名称（可选）
   * @param role 角色（可选）
   */
  async addExistingUser(
    email: string,
    userName?: string,
    role: "member" | "admin" | "viewer" = "member"
  ): Promise<void> {
    await this.searchAndSelectUser(email, userName);

    // if (role !== "member") {
    //   await this.selectRole(role);
    // }

    await this.addButton.click();

    // 等待操作完成
    await this.page.waitForTimeout(1000);

    // 检查是否成功
    if (await this.successMessage.isVisible()) {
      await this.successMessage.waitFor({ state: "hidden" });
    }

    await this.waitForClose();
  }

  /**
   * 取消添加成员
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
   * 获取对话框标题
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
   * 检查是否正在搜索用户
   * @returns 是否正在搜索
   */
  async isSearching(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
  }

  /**
   * 获取搜索结果数量
   * @returns 搜索结果数量
   */
  async getSearchResultCount(): Promise<number> {
    return await this.searchResults.count();
  }

  /**
   * 获取搜索结果
   * @returns 搜索结果文本数组
   */
  async getSearchResults(): Promise<string[]> {
    const count = await this.getSearchResultCount();
    const results: string[] = [];

    for (let i = 0; i < count; i++) {
      const result = this.searchResults.nth(i);
      const text = await result.textContent();
      if (text) {
        results.push(text.trim());
      }
    }

    return results;
  }

  /**
   * 检查是否有错误消息
   * @returns 是否有错误消息
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * 获取错误消息
   * @returns 错误消息文本
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasErrorMessage()) {
      const text = await this.errorMessage.textContent();
      return text?.trim() || "";
    }
    return "";
  }

  /**
   * 检查是否有成功消息
   * @returns 是否有成功消息
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * 清空表单
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();

    // 重置角色（如果已选择）
    if (await this.roleSelectTrigger.isVisible()) {
      const triggerText = await this.roleSelectTrigger.textContent();
      if (triggerText && !triggerText.includes("Member")) {
        await this.selectRole("member"); // 重置为默认值
      }
    }
  }

  /**
   * 获取成功消息
   * @returns 成功消息文本
   */
  async getSuccessMessage(): Promise<string> {
    if (await this.hasSuccessMessage()) {
      const text = await this.successMessage.textContent();
      return text?.trim() || "";
    }
    return "";
  }
}
