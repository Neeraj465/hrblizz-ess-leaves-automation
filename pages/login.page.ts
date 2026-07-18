import { expect, Locator } from "@playwright/test";
import { BasePage } from "./base";
import HomePage from "./home.page";
import { Credentials } from "@support/environments/environment.types";
import env from "@support/environments/env.config";
import { LEAVE_ROUTES } from "@support/constants/leaves.constants";

export default class LoginPage extends BasePage {

  readonly LOCATORS = {
    emailInput: "input[name='email']",
    passwordInput: "input[name='password']",
  };

  private get emailInput(): Locator {
    return this.page.locator(this.LOCATORS.emailInput).describe("Email input");
  }

  private get passwordInput(): Locator {
    return this.page
      .locator(this.LOCATORS.passwordInput)
      .describe("Password input");
  }

  private get loginButton(): Locator {
    return this.page
      .getByRole("button", { name: "Login" })
      .describe("Login button");
  }

  async goto(): Promise<void> {
    await this.page.goto(env.BASE_URL);
    await expect(this.emailInput).toBeVisible();
  }

  async fillCredentials(creds: Credentials): Promise<void> {
    await this.emailInput.fill(creds.username);
    await this.passwordInput.fill(creds.password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  /** Login with the given credentials and wait for the home page to load. 
   * @param creds The username/password to use for login
   * @returns An instance of HomePage representing the loaded home page
  */
  async loginAs(creds: Credentials): Promise<HomePage> {
    await this.goto();
    await this.fillCredentials(creds);
    await this.submit();
    const home = new HomePage(this.page);
    await home.waitUntilLoaded();
    return home;
  }

  /** Wait until the login page is visible.
   * @returns True if the login page is visible, false otherwise
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.emailInput.isVisible();
  }
}
