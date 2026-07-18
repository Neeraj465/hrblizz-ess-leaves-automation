import { Page } from "@playwright/test";

/**
 * Abstract base for all page objects.
 * Every page exposes LOCATORS (CSS/role selectors).
 */
type LocatorValue = string;

export abstract class BasePage {
  abstract readonly LOCATORS: Record<string, LocatorValue>;
  constructor(protected page: Page) {}

  /** Reload the current page so it picks up server-side data changes. */
  async reload(): Promise<void> {
    await this.page.reload();
  }
}
