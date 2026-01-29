import { Page, Locator } from "@playwright/test";

export class ProjectFormDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.title = page.getByRole("heading", {
      name: /create new project|edit project/i,
    });
    this.nameInput = this.dialog.getByPlaceholder("My Project");
    this.descriptionInput = page
      .getByLabel("Description (optional)")
      .or(page.getByPlaceholder("Project description..."));
    this.createButton = page.getByRole("button", {
      name: /create project|update project/i,
    });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.errorMessage = page.getByRole("alert");
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: "visible" });
    await this.title.waitFor({ state: "visible" });
  }

  async waitForClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  async fillForm(name: string, description?: string) {
    await this.nameInput.fill(name);
    if (description && (await this.descriptionInput.isVisible())) {
      await this.descriptionInput.fill(description);
    }
  }

  async createProject(name: string, description?: string) {
    await this.fillForm(name, description);
    await this.createButton.click();
    await this.waitForClose();
  }

  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }

  async isSubmitDisabled(): Promise<boolean> {
    return await this.createButton.isDisabled();
  }
}
