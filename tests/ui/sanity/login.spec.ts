import { test, expect } from "@tests/ui/base";
import env from "@support/environments/env.config";
import LoginPage from "@pages/login.page";
import { NavItem } from "@support/enums";

test.describe("Validate login & role-based navigation", () => {
  test("TS-01: Employee logs in and sees only employee menus", async ({
    employeeSession,
  }) => {
    const { home } = employeeSession;

    await test.step("Employee sees the Leaves sub-items", async () => {
      expect(await home.isNavItemVisible(NavItem.MY_LEAVES)).toBe(true);
      expect(await home.isNavItemVisible(NavItem.CALENDAR)).toBe(true);
    });

    await test.step("Employee does NOT see the manager-only Approvals menu", async () => {
      expect(await home.isNavItemVisible(NavItem.APPROVALS)).toBe(false);
    });
  });

  test("TS-02: Invalid credentials are rejected", async ({ page }) => {
    const login = new LoginPage(page);

    await test.step("Submit a bad password", async () => {
      await login.goto();
      await login.fillCredentials({
        username: env.EMPLOYEE.username,
        password: "definitely-wrong-password",
      });
      await login.submit();
    });

    await test.step("User stays on the login page", async () => {
      await expect
        .poll(() => login.isOnLoginPage(), { timeout: 10_000 })
        .toBe(true);
    });
  });

  test("TS-02b: Manager logs in and sees the Approvals menu",
    async ({ managerSession }) => {
      const { home } = managerSession;
      await test.step("Manager sees the correct navigation items including Approvals", async () => {
        expect(await home.isNavItemVisible(NavItem.MY_LEAVES)).toBe(true);
        expect(await home.isNavItemVisible(NavItem.CALENDAR)).toBe(true);
        expect(await home.isNavItemVisible(NavItem.APPROVALS)).toBe(true);
      });
    },
  );
});
