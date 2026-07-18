import { expect, Locator } from "@playwright/test";
import { BasePage } from "../base";
import { LeaveType, PlaceholderText } from "@support/enums";
import { DateUtils } from "@support/date-utils";
import { LEAVE_MESSAGES } from "@support/constants/leaves.constants";

export default class LeaveRequestModal extends BasePage {
  readonly TEST_IDS = {};

  readonly LOCATORS = {
    typeTrigger: "#leave-types",
    typeOption: "#dropdown-list_leave-types div[id*='request-type']",
    monthHeader: ".date-picker__header__content",
    prevMonth: ".date-picker__header__arrow-wrapper.left",
    nextMonth: ".date-picker__header__arrow-wrapper.right",
    dayCell: ".current__month .day-cell",
    balanceChange: ".bd__balance-change--value",
    balanceBubble: ".bd__balance--row.bubbles",
    overlapBanner: ".banner__caption",
  };

  private get typeTrigger(): Locator {
    return this.page
      .locator(this.LOCATORS.typeTrigger)
      .describe("Leave-type dropdown");
  }

  private get monthHeader(): Locator {
    return this.page
      .locator(this.LOCATORS.monthHeader)
      .describe("Calendar month header");
  }

  private get requestButton(): Locator {
    return this.page
      .getByRole("button", { name: "Request leave" })
      .describe("Request-leave button");
  }

  private get saveDraftButton(): Locator {
    return this.page
      .getByRole("button", { name: "Save as draft" })
      .describe("Save-as-draft button");
  }

  private get cancelButton(): Locator {
    return this.page
      .getByRole("button", { name: "Cancel" })
      .describe("Cancel button");
  }

  private get overlapBanner(): Locator {
    return this.page
      .locator(this.LOCATORS.overlapBanner)
      .filter({
        hasText: LEAVE_MESSAGES.overlapDetected,
      })
      .describe("Overlapping-leave banner");
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.typeTrigger).toBeVisible({ timeout: 15_000 });
    await expect(this.monthHeader).toBeVisible();
  }

  /** Pick a leave type from the dropdown 
   * @param type The leave type to select (e.g., Annual, Sick)
   * @returns The current instance for method chaining
  */
  async selectType(type: LeaveType): Promise<this> {
    await this.typeTrigger.click();
    await this.page
      .locator(this.LOCATORS.typeOption, { hasText: type })
      .describe(`${type} option`)
      .click();
    await expect(this.typeTrigger).toContainText(type);
    return this;
  }

  /**
   * Select a start date, and an end date when one is given. 
   * The picker only allows weekday boundaries, so callers should pass weekdays.
   * @param start The start date to select
   * @param end Optional end date to select (defaults to the same day as start)
   * @returns The current instance for method chaining
   */
  async setDateRange(start: Date, end?: Date): Promise<this> {
    await this.pickDay(start);
    if (end) await this.pickDay(end);
    return this;
  }

  /** Navigate to the month of `date` and click its day cell 
   * @param date The date to select in the calendar
   * @returns A promise that resolves when the day has been clicked
  */
  private async pickDay(date: Date): Promise<void> {
    await this.goToMonth(date);
    const day = String(DateUtils.dayOfMonth(date));
    await this.page
      .locator(this.LOCATORS.dayCell)
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first()
      .describe(`Calendar day cell for ${date.toDateString()}`)
      .click();
  }

  /** Step the calendar forward/back until it shows the target month 
   * @param date The date whose month to navigate to
   * @returns A promise that resolves when the calendar shows the target month
  */
  private async goToMonth(date: Date): Promise<void> {
    const target = DateUtils.monthYear(date);
    for (let i = 0; i < 24; i++) {
      const current = (await this.monthHeader.innerText()).trim();
      if (current === target) return;
      const targetTime = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const currentTime = new Date(`${current} 1`).getTime();
      const arrow =
        targetTime > currentTime
          ? this.LOCATORS.nextMonth
          : this.LOCATORS.prevMonth;
      await this.page.locator(arrow).click();
    }
    throw new Error(`Could not navigate the calendar to ${target}`);
  }

  async fillNotes(text: string): Promise<this> {
    await this.page.getByPlaceholder(PlaceholderText.leaveNote).fill(text);
    return this;
  }

  async submit(): Promise<void> {
    await this.requestButton.click();
  }

  async saveAsDraft(): Promise<void> {
    await this.saveDraftButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Number of days the app will deduct for the current selection. Read from the
   * balance-change value ("- 3d"). Note: the app counts weekends inside a range
   * (expected behaviour), so this equals DateUtils.calendarDaysInRange, not working days.
   * @returns The number of days to be deducted
   */
  async getDayCount(): Promise<number> {
    const raw = await this.page
      .locator(this.LOCATORS.balanceChange)
      .first()
      .innerText();
    const match = raw.replace(/\s+/g, "").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : Number.NaN;
  }

  /**
   * Projected balance after the current selection is applied, in days. Read from
   * the balance bubble i.e. the value after the arrow.
   * Goes negative when the request exceeds the remaining balance.
   * @returns The projected balance after the current selection is applied
   */
  async getBalanceAfter(): Promise<number> {
    const raw = await this.page
      .locator(this.LOCATORS.balanceBubble)
      .first()
      .innerText();
    const parts = raw.replace(/\s+/g, "").split(/→|->/);
    const after = parts[parts.length - 1]?.match(/-?\d+(?:\.\d+)?/);
    return after ? Number(after[0]) : Number.NaN;
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.requestButton.isEnabled();
  }

  async isSaveDraftEnabled(): Promise<boolean> {
    return this.saveDraftButton.isEnabled();
  }

  async isOverlapWarningVisible(): Promise<boolean> {
    try {
      await this.overlapBanner.first().waitFor({ state: "visible", timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickConfirmButton(): Promise<void> {
    await this.page.getByRole("button", { name: "Confirm" }).click();
  }
}
