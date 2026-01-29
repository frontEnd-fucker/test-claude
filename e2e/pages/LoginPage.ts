import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // 使用更可靠的选择器：先尝试getByLabel，然后尝试getByPlaceholder
    this.emailInput = page
      .getByLabel("Email")
      .or(page.locator("#email"))
      .or(page.getByPlaceholder("you@example.com"));
    this.passwordInput = page
      .getByLabel("Password")
      .or(page.locator("#password"))
      .or(page.getByPlaceholder("••••••••"));
    // 使用更精确的选择器来避免匹配多个按钮：
    // 1. 首先在form元素内查找type="submit"的按钮（最可靠，只匹配表单提交按钮）
    // 2. 然后在Card组件内查找精确文本"Sign In"的按钮（避免匹配Header中的按钮）
    // 注意：不要使用宽泛的正则表达式，以免匹配到"Sign in with Google"按钮
    this.loginButton = page
      .locator('form button[type="submit"]') // 只在form元素内查找
      .or(
        page
          .locator("form")
          .getByRole("button", { name: "Sign In", exact: true })
      )
      .first();
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/auth/login");
    // 等待页面加载完成
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    console.log(`尝试登录: ${email}`);

    // 确保输入框可见
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // 清空并填写
    await this.emailInput.fill("");
    await this.emailInput.fill(email);
    await this.passwordInput.fill("");
    await this.passwordInput.fill(password);

    // 确保按钮可用
    await this.loginButton.waitFor({ state: "visible" });

    // 点击登录按钮
    await this.loginButton.click();

    // 等待可能的网络请求
    await this.page.waitForLoadState("networkidle");

    // 检查是否有错误消息
    const error = await this.getErrorMessage();
    if (error) {
      console.error(`登录错误: ${error}`);
      console.error(`使用的邮箱: ${email}`);
      console.error("请检查:");
      console.error("1. 测试用户是否在Supabase中存在");
      console.error("2. 密码是否正确");
      console.error(
        "3. 环境变量配置 (.env.local 中的 TEST_USER_EMAIL 和 TEST_USER_PASSWORD)"
      );
      throw new Error(
        `登录失败: ${error}\n使用的邮箱: ${email}\n请检查测试用户凭据是否正确配置在.env.local文件中`
      );
    }
  }

  async getErrorMessage(): Promise<string> {
    // 这里应该用更严谨的错误信息文案去判断，避免一些开发工具中使用了alert元素， 导致page.getByRole("alert").isVisible为true造成判断错误，目前先直接返回""
    // try {
    //   if (await this.errorMessage.isVisible({ timeout: 2000 })) {
    //     return (await this.errorMessage.textContent()) ?? "";
    //   }
    // } catch {
    //   // 忽略超时错误
    // }
    // return "";

    return "";
  }

  async waitForLoginSuccess() {
    // 等待URL变为首页或项目页面
    // 登录后重定向到 /，然后重定向到 /projects
    try {
      // 等待URL变化（从/auth/login变化）
      await this.page.waitForURL(
        (url) => !url.pathname.includes("/auth/login"),
        { timeout: 10000 }
      );

      // 检查是否在首页或项目页面
      const currentUrl = this.page.url();
      console.log(`登录后URL: ${currentUrl}`);

      if (currentUrl.includes("/projects")) {
        console.log("已重定向到项目页面");
      } else if (
        currentUrl === "http://localhost:3000/" ||
        currentUrl === "http://localhost:3000"
      ) {
        console.log("在首页，等待可能的进一步重定向...");
        // 首页可能重定向到/projects
        await this.page.waitForURL("**/projects", { timeout: 5000 });
      }

      // 最终等待项目页面完全加载
      await this.page.waitForURL("**/projects");
      await this.page.waitForLoadState("networkidle");
      console.log("登录成功，在项目页面");
    } catch (error) {
      console.error("等待登录成功超时:", error);

      // 检查是否仍然在登录页面（可能登录失败）
      if (this.page.url().includes("/auth/login")) {
        const errorMsg = await this.getErrorMessage();
        console.error("登录失败原因:");
        console.error("1. 测试用户凭据不正确");
        console.error("2. 网络连接问题");
        console.error("3. 应用认证服务异常");
        console.error(`当前URL: ${this.page.url()}`);
        console.error(`错误信息: ${errorMsg || "无错误信息显示"}`);
        throw new Error(
          `登录失败，仍在登录页面。错误信息: ${
            errorMsg || "未知错误"
          }\n请检查测试用户凭据配置 (.env.local 文件)`
        );
      }

      console.error(`登录后重定向异常。当前URL: ${this.page.url()}`);
      console.error("可能的原因:");
      console.error("1. 应用重定向逻辑变更");
      console.error("2. 网络延迟或超时");
      console.error("3. 页面加载失败");
      throw new Error(
        `登录后重定向失败。当前URL: ${this.page.url()}\n请检查应用是否正常运行，以及重定向逻辑是否正确`
      );
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return !this.page.url().includes("/auth/login");
  }
}
