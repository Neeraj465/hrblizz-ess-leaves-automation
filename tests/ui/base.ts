import { test as base } from "@playwright/test";
import env from "@support/environments/env.config";
import LoginPage from "@pages/login.page";
import HomePage from "@pages/home.page";
import MyLeavesPage from "@pages/leaves/my-leaves.page";
import ApprovalsPage from "@pages/leaves/approvals.page";
import { Credentials } from "@support/environments/environment.types";
import { ApiSession } from "@support/api-utils";
import type { Page } from "@playwright/test";

// Page objects for driving the UI, plus the API session data (sessionToken,
// employeeId, legalEntityId) so tests can call the backend directly for teardown.
type RoleSession = ApiSession & {
  page: Page;
  home: HomePage;
  myLeaves: MyLeavesPage;
  approvals: ApprovalsPage;
};

type Fixtures = {
  loginPage: LoginPage;
  employeeSession: RoleSession;
  managerSession: RoleSession;
};

/** Sign in through the UI, land on "My leaves", and return the role's page
 * objects plus the session data (sessionToken from the cookie, employeeId /
 * legalEntityId from the login response) so tests can call the backend directly.
 * @param page - The Playwright page object.
 * @param creds - The credentials to use for login.
 * @returns The role's page objects plus session data.
 */
async function buildSession(page: Page, creds: Credentials): Promise<RoleSession> {
  // Grab the ids fom the login response.
  let employeeId = 0;
  let legalEntityId = 0;
  const onResponse = async (res: { url(): string; json(): Promise<any> }) => {
    if (res.url().includes("/login/credential")) {
      const emp = (await res.json().catch(() => null))?.employees?.[0];
      if (emp) {
        employeeId = emp.id;
        legalEntityId = emp.legalEntity.id;
      }
    }
  };
  page.on("response", onResponse);
  const home = await new LoginPage(page).loginAs(creds);
  page.off("response", onResponse);

  const myLeaves = await home.goToMyLeaves();

  // Session token is the cookie the login set.
  const cookies = await page.context().cookies();
  const sessionToken = cookies.find((c) => c.name === "X-Session-Token")?.value ?? "";

  return {
    page,
    home,
    myLeaves,
    approvals: new ApprovalsPage(page),
    sessionToken,
    employeeId,
    legalEntityId,
  };
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  employeeSession: async ({ page }, use) => {
    const session = await buildSession(page, env.EMPLOYEE);
    await use(session);
  },

  managerSession: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await buildSession(page, env.MANAGER);
    await use(session);
    await context.close();
  },
});

export { expect } from "@playwright/test";
