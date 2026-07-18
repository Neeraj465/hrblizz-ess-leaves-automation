import { expect, Locator } from "@playwright/test";
import { BasePage } from "../base";
import { LeaveStatus } from "@support/enums";

export default class ApprovalsPage extends BasePage {
  readonly TEST_IDS = {};

  readonly LOCATORS = {
    requestTile: "#tableBody-leave-table tr",
    statusTag: "td[label='Status'] a",
    approveButton: "button[data-test='approve']",
    rejectButton: "button[data-test='reject']",
    approvedTab: "#reviewer-header .cpn-pages #approved",
  };

  /** A pending request tile for a given employee 
   * @param employeeName The name of the employee
   * @returns The Locator for the employee's request tile
  */
  private requestTileFor(employeeName: string): Locator {
    return this.page
      .locator(this.LOCATORS.requestTile)
      .filter({ hasText: employeeName })
      .describe(`Approval tile for ${employeeName}`);
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/reviewer\/listing/i, { timeout: 10_000 });
  }

  /** Approve the (first) pending request for the given employee
   * @param employeeName The name of the employee
   */
  async approveRequestFor(employeeName: string): Promise<void> {
    const tile = this.requestTileFor(employeeName).first();
    await expect(tile).toBeVisible();
    await tile
      .locator(this.LOCATORS.approveButton)
      .describe("Approve button")
      .click();
    await this.clickConfirmButton();
  }

  /** Reject the (first) pending request for the given employee 
   * @param employeeName The name of the employee
  */
  async rejectRequestFor(employeeName: string): Promise<void> {
    const tile = this.requestTileFor(employeeName).first();
    await expect(tile).toBeVisible();
    await tile
      .locator(this.LOCATORS.rejectButton)
      .describe("Reject button")
      .click();
  }

  /** Status label currently shown on the employee's request tile 
   * @param employeeName The name of the employee
   * @param requestId The ID of the leave request
   * @returns The status text of the leave request
   */
  async getStatusFor(employeeName: string, requestId: string): Promise<string> {
    let tile: Locator;
    if(requestId) {
      tile = this.requestTileFor(employeeName)
        .filter({ hasText: requestId })
        .first();
    }

    const tag = (tile ?? this.requestTileFor(employeeName).first())
      .locator(this.LOCATORS.statusTag)
      .first();
    return (await tag.innerText()).trim();
  }

  async isRequestApproved(employeeName: string, requestId?: string): Promise<boolean> {
    return (await this.getStatusFor(employeeName, requestId)) === LeaveStatus.APPROVED;
  }

  async clickConfirmButton(): Promise<void> {
    await this.page.getByRole("button", { name: "Confirm" }).click();
  }

  async getRequestIdFor(employeeName: string): Promise<string> {
    const tile = this.requestTileFor(employeeName).first();
    const id: string = await tile.locator("td")
      .nth(1)
      .innerText();

    console.log(`Request ID for ${employeeName}: ${id.trim()}`);

    return id.trim();
  }

  async switchToApprovedTab(): Promise<void> {
    await this.page.locator(this.LOCATORS.approvedTab).click();
  }
}
