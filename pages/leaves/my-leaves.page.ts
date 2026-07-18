import { expect, Locator } from "@playwright/test";
import { BasePage } from "../base";
import { LeaveType, LeaveStatus } from "@support/enums";
import LeaveRequestModal from "./leave-request.modal";

export default class MyLeavesPage extends BasePage {

  readonly LOCATORS = {
    balanceCard: ".balance-card__wrapper",
    cardHeading: ".heading.heading-02",
    balanceRow: ".balance-row",
    totalRow: ".balance-row.balance-row_total",
    tile: ".tile-wrapper",
    tileHeading: ".tile-heading",
    statusTag: ".tag__text",
    addButton: "button.button-action-floating",
    leavesCard: ".my-leaves-custom-card",
    approvedLeaves: "div[id*='mercansTable'] [id*='tableBody-mercansTable'] tr",
    approvedLeaveStatusTag: "td[label='Status'] span",
  };

  private get addButton(): Locator {
    return this.page
      .getByRole("button", { name: "Request new leave" })
      .describe("Request-new-leave floating button");
  }

  /** Balance card for a given leave type (matched by its heading text). 
   * @param type The leave type (e.g., Annual, Sick)
   * @returns The Locator for the balance card
   */
  private balanceCard(type: LeaveType): Locator {
    return this.page
      .locator(this.LOCATORS.balanceCard)
      .filter({ hasText: type })
      .describe(`${type} balance card`);
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/my-leaves/, { timeout: 30_000 });
    await expect(this.addButton).toBeVisible();
  }

  /** Open the "Add new leave" request form. 
   * @returns An instance of LeaveRequestModal representing the opened form
  */
  async openRequestForm(): Promise<LeaveRequestModal> {
    await this.addButton.click();
    const modal = new LeaveRequestModal(this.page);
    await modal.waitUntilLoaded();
    return modal;
  }

  /**
   * Estimated remaining balance for a leave type, in days.
   * Reads the card's total row ("Estimated balance  23 d") and parses the number.
   * Goes negative when the user has exceeded their balance.
   * @param type The leave type (e.g., Annual, Sick)
   * @returns The estimated remaining balance in days
   */
  async getRemainingBalance(type: LeaveType): Promise<number> {
    const totalRow = this.balanceCard(type)
      .locator(this.LOCATORS.totalRow)
      .describe(`${type} estimated-balance row`);
    await expect(totalRow).toBeVisible();
    return this.parseDays(await totalRow.innerText());
  }

  /** A request tile located by leave type and (optionally) status. 
   * @param type The leave type (e.g., Annual, Sick)
   * @param status Optional status to filter by (e.g., Pending, Approved)
   * @returns The Locator for the request tile
  */
  requestTile(type: LeaveType, status?: LeaveStatus): Locator {
    let tile = this.page
      .locator(this.LOCATORS.tile)
      .filter({ hasText: type });
    if (status) tile = tile.filter({ hasText: status });
    return tile.describe(
      `${type} request tile${status ? ` (${status})` : ""}`,
    );
  }

  /** Whether at least one request tile of the given type/status is shown.
   * @param type The leave type (e.g., Annual, Sick)
   * @param status Optional status to filter by (e.g., Pending, Approved)
   * @returns True if at least one matching request tile is present, false otherwise
  */
  async hasRequest(type: LeaveType, status?: LeaveStatus): Promise<boolean> {
    return (await this.requestTile(type, status).count()) > 0;
  }

  /** Extract the first integer day-count from a "… 23 d" style label. 
   * @param text The text containing the day count (e.g., "Estimated balance  23 d")
   * @returns The extracted day count as a number, or NaN if not found
   */
  private parseDays(text: string): number {
    const match = text.replace(/\s+/g, " ").match(/(-?\d+(?:\.\d+)?)\s*d/i);
    return match ? Number(match[1]) : Number.NaN;
  }

  async getApprovedLeaveDetails(type: LeaveType, requestId?: string): Promise<Locator> {
    let leaveDetail =  this.page.locator(this.LOCATORS.leavesCard)
      .filter({ hasText: "Ongoing / Upcoming" })
      .locator(this.LOCATORS.approvedLeaves)
      .filter({ hasText: type })
      .describe(`Approved leave details for ${type}`);
    if(requestId) {
      leaveDetail = leaveDetail.filter({ hasText: requestId });
    }
    return leaveDetail;
  }
}
