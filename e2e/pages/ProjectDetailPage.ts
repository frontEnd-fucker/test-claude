import { Page, Locator, expect } from "@playwright/test";
import { AddMemberDialog } from "./AddMemberDialog";

export class ProjectDetailPage {
  readonly page: Page;
  readonly projectHeader: Locator;
  readonly projectTitle: Locator;
  readonly projectDescription: Locator;
  readonly membersSection: Locator;
  readonly membersCount: Locator;
  readonly membersList: Locator;
  readonly memberItems: Locator;
  readonly addMemberButton: Locator;
  readonly noMembersMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // 项目头部定位器
    this.projectHeader = page.locator('div[class*="rounded-xl border bg-card"]').first();
    this.projectTitle = page.getByRole("heading", { name: /^[^$]/ }).first(); // 第一个标题
    this.projectDescription = page.locator('p.text-muted-foreground').first();

    // 成员区域定位器
    this.membersSection = page.locator('div[class*="mt-4 pt-4 border-t"]');
    this.membersCount = page.locator('h3.text-sm.font-medium').or(
      page.locator('text=/Members \\(\\d+\\)/')
    );
    this.membersList = page.locator('div.flex.flex-wrap.gap-2').or(
      page.locator('div.space-y-3')
    );
    this.memberItems = page.locator('[data-testid="member-item"]').or(
      page.locator('div.relative.group').or(
        page.locator('div.flex.items-center.justify-between.rounded-lg.border.p-3')
      )
    );
    this.addMemberButton = page.getByRole("button", { name: /Add Member|Add First Member/i });
    this.noMembersMessage = page.locator('text=No members yet');
  }

  /**
   * 导航到项目详情页
   * @param projectId 项目ID
   */
  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/project/${projectId}`);
    await this.waitForLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad(): Promise<void> {
    // 等待项目标题出现
    await this.projectTitle.waitFor({ state: "visible" });

    // 等待成员区域加载
    await this.membersSection.waitFor({ state: "visible" });

    // 等待可能的加载状态消失
    await this.page.waitForTimeout(500);
  }

  /**
   * 获取项目标题
   * @returns 项目标题
   */
  async getProjectTitle(): Promise<string> {
    const title = await this.projectTitle.textContent();
    return title?.trim() || "";
  }

  /**
   * 获取项目描述
   * @returns 项目描述
   */
  async getProjectDescription(): Promise<string> {
    if (await this.projectDescription.isVisible()) {
      const description = await this.projectDescription.textContent();
      return description?.trim() || "";
    }
    return "";
  }

  /**
   * 获取成员数量
   * @returns 成员数量
   */
  async getMemberCount(): Promise<number> {
    // 尝试从标题获取成员数量
    const countText = await this.membersCount.textContent();
    if (countText) {
      const match = countText.match(/Members\s*\((\d+)\)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // 如果无法从标题获取，则计算成员项数量
    return await this.memberItems.count();
  }

  /**
   * 获取成员名称列表
   * @returns 成员名称数组
   */
  async getMemberNames(): Promise<string[]> {
    const count = await this.memberItems.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const memberItem = this.memberItems.nth(i);

      // 尝试获取成员名称
      const nameLocator = memberItem.locator('p.font-medium').or(
        memberItem.locator('div[class*="text-sm"]')
      );

      if (await nameLocator.isVisible()) {
        const name = await nameLocator.textContent();
        if (name) {
          names.push(name.trim());
        }
      } else {
        // 对于紧凑模式，可能只有头像
        const avatarFallback = memberItem.locator('span[class*="AvatarFallback"]');
        if (await avatarFallback.isVisible()) {
          const initial = await avatarFallback.textContent();
          if (initial) {
            names.push(`User ${initial}`);
          }
        }
      }
    }

    return names;
  }

  /**
   * 获取成员邮箱列表
   * @returns 成员邮箱数组
   */
  async getMemberEmails(): Promise<string[]> {
    const count = await this.memberItems.count();
    const emails: string[] = [];

    for (let i = 0; i < count; i++) {
      const memberItem = this.memberItems.nth(i);

      // 尝试获取成员邮箱
      const emailLocator = memberItem.locator('p.text-sm.text-muted-foreground');

      if (await emailLocator.isVisible()) {
        const email = await emailLocator.textContent();
        if (email) {
          emails.push(email.trim());
        }
      }
    }

    return emails;
  }

  /**
   * 检查成员是否存在
   * @param email 成员邮箱
   * @returns 是否存在
   */
  async hasMember(email: string): Promise<boolean> {
    const emails = await this.getMemberEmails();
    return emails.some(e => e.toLowerCase().includes(email.toLowerCase()));
  }

  /**
   * 检查成员是否存在（通过名称）
   * @param name 成员名称
   * @returns 是否存在
   */
  async hasMemberByName(name: string): Promise<boolean> {
    const names = await this.getMemberNames();
    return names.some(n => n.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * 打开添加成员对话框
   * @returns 添加成员对话框对象
   */
  async openAddMemberDialog(): Promise<AddMemberDialog> {
    const addMemberDialog = new AddMemberDialog(this.page);

    // 点击添加成员按钮
    await this.addMemberButton.click();

    // 等待对话框打开
    await addMemberDialog.waitForOpen();

    return addMemberDialog;
  }

  /**
   * 删除指定成员
   * @param email 成员邮箱
   */
  async removeMember(email: string): Promise<void> {
    const count = await this.memberItems.count();

    for (let i = 0; i < count; i++) {
      const memberItem = this.memberItems.nth(i);

      // 检查这个成员项是否包含目标邮箱
      const emailLocator = memberItem.locator('p.text-sm.text-muted-foreground');
      if (await emailLocator.isVisible()) {
        const memberEmail = await emailLocator.textContent();
        if (memberEmail && memberEmail.toLowerCase().includes(email.toLowerCase())) {
          // 找到目标成员，打开操作菜单
          const moreButton = memberItem.getByRole("button", { name: /More|Actions/i }).or(
            memberItem.locator('button[aria-label*="menu"]').or(
              memberItem.locator('button:has(svg[aria-label*="more"])')
            )
          );

          await moreButton.click();

          // 点击"Remove Member"选项
          const removeOption = this.page.getByRole("menuitem", { name: /Remove Member/i });
          await removeOption.click();

          // 处理确认对话框
          await this.handleRemoveConfirmation();

          // 等待成员被移除
          await this.page.waitForTimeout(1000);
          return;
        }
      }
    }

    throw new Error(`Member with email ${email} not found`);
  }

  /**
   * 处理删除确认对话框
   */
  private async handleRemoveConfirmation(): Promise<void> {
    // 检查是否有确认对话框
    const confirmDialog = this.page.locator('text=/Are you sure|Confirm/i');

    if (await confirmDialog.isVisible()) {
      // 点击确认按钮
      const confirmButton = this.page.getByRole("button", { name: /Confirm|OK|Yes/i });
      await confirmButton.click();

      // 等待确认对话框消失
      await confirmDialog.waitFor({ state: "hidden" });
    }

    // 如果没有确认对话框，直接继续
    await this.page.waitForTimeout(500);
  }

  /**
   * 刷新页面
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
  }

  /**
   * 检查是否有"添加成员"按钮
   * @returns 是否有添加成员按钮
   */
  async hasAddMemberButton(): Promise<boolean> {
    return await this.addMemberButton.isVisible();
  }

  /**
   * 检查是否显示"无成员"消息
   * @returns 是否显示无成员消息
   */
  async hasNoMembersMessage(): Promise<boolean> {
    return await this.noMembersMessage.isVisible();
  }

  /**
   * 等待成员列表更新
   * @param expectedCount 期望的成员数量
   * @param timeout 超时时间（毫秒）
   */
  async waitForMemberCount(expectedCount: number, timeout = 5000): Promise<void> {
    await expect(async () => {
      const count = await this.getMemberCount();
      expect(count).toBe(expectedCount);
    }).toPass({ timeout });
  }

  /**
   * 等待特定成员出现
   * @param email 成员邮箱
   * @param timeout 超时时间（毫秒）
   */
  async waitForMember(email: string, timeout = 5000): Promise<void> {
    await expect(async () => {
      const hasMember = await this.hasMember(email);
      expect(hasMember).toBe(true);
    }).toPass({ timeout });
  }

  /**
   * 等待特定成员消失
   * @param email 成员邮箱
   * @param timeout 超时时间（毫秒）
   */
  async waitForMemberRemoved(email: string, timeout = 5000): Promise<void> {
    await expect(async () => {
      const hasMember = await this.hasMember(email);
      expect(hasMember).toBe(false);
    }).toPass({ timeout });
  }
}