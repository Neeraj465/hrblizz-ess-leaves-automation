import { expect, Locator } from "@playwright/test";
import { BasePage } from "./base";
import { NavItem } from "@support/enums";
import MyLeavesPage from "./leaves/my-leaves.page";
import ApprovalsPage from "./leaves/approvals.page";

export default class HomePage extends BasePage {

  readonly LOCATORS = {
    appShell: ".navigation__header",
    menuLink: ".menu-link",
    menuLinkTitle: ".menu-link__title-text",
    subLink: "a.sub-link",
  };

  /** Stable element that is only present once the ESS shell has finished loading. 
   * @returns The Locator for the app shell
  */
  private get appShell(): Locator {
    return this.page
      .locator(this.LOCATORS.appShell)
      .describe("ESS navigation header");
  }

  /** Top-level, collapsible "Leaves" navigation section. 
   * @returns The Locator for the "Leaves" section
  */
  private get leavesSection(): Locator {
    return this.page
      .locator(this.LOCATORS.menuLink)
      .filter({ hasText: NavItem.LEAVES })
      .describe('Left-nav "Leaves" section');
  }

  private subLink(name: NavItem | string): Locator {
    return this.page
      .locator(this.LOCATORS.subLink, { hasText: String(name) })
      .describe(`Left-nav sub-item "${name}"`);
  }

  /**
   * Resolves once the app shell is on screen. Uses a longer timeout than the
   * default because the launchpad shows a short "Loading languages" splash
   * before the shell renders.
   * @returns Resolves once the app shell is visible
   */
  async waitUntilLoaded(): Promise<void> {
    await expect(this.appShell).toBeVisible({ timeout: 30_000 });
  }

  /** Expand the "Leaves" section if it is currently collapsed. 
   * @returns Resolves once the "Leaves" section is expanded
  */
  private async ensureLeavesExpanded(): Promise<void> {
    const section = this.leavesSection;
    await expect(section).toBeVisible();
    const expanded = await section.evaluate((el) =>
      el.className.includes("menu-link--submenu-expanded"),
    );
    if (!expanded) await section.click();
    await expect(this.subLink(NavItem.MY_LEAVES)).toBeVisible();
  }

  /** Open Leaves → My leaves and return its page object. 
   * @returns An instance of MyLeavesPage representing the opened page
  */
  async goToMyLeaves(): Promise<MyLeavesPage> {
    await this.ensureLeavesExpanded();
    await this.subLink(NavItem.MY_LEAVES).click();
    const myLeaves = new MyLeavesPage(this.page);
    await myLeaves.waitUntilLoaded();
    return myLeaves;
  }

  /**
   * Open Leaves → Approvals and return its page object. Only managers see this link.
   * @returns An instance of ApprovalsPage representing the opened page
   */
  async goToApprovals(): Promise<ApprovalsPage> {
    await this.ensureLeavesExpanded();
    await this.subLink(NavItem.APPROVALS).click();
    const approvals = new ApprovalsPage(this.page);
    await approvals.waitUntilLoaded();
    return approvals;
  }

  /**
   * True when the given left-nav item is visible for the signed-in user.
   * Used by the role test to confirm a manager sees "Approvals" while an
   * employee does not. Checks both top-level sections and sub-items.
   * @param item The navigation item to check (e.g., "Leaves", "My leaves", "Approvals")
   * @param isSection True if the item is a top-level section, false if it is a sub-item
   * @returns True if the item is visible, false otherwise
   */
  async isNavItemVisible(item: NavItem, isSection?: boolean): Promise<boolean> {
    let itemLocator: Locator;
    if (isSection) {
      itemLocator = this.page
        .locator(this.LOCATORS.menuLink)
        .filter({ hasText: String(item) });
    } else {
      itemLocator = this.page.locator(this.LOCATORS.subLink, {
        hasText: String(item),
      });
    }
    try {
      await itemLocator.first().waitFor({ state: "visible", timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }
  
}
