import { test, expect } from "@tests/ui/base";
import { LeaveType } from "@support/enums";
import { DateUtils } from "@support/date-utils";

test.describe("Validate balance enforcement", () => {
  test("TS-07: Annual request exceeding remaining balance disables submit", async ({
    employeeSession,
  }) => {
    const { myLeaves } = employeeSession;

    const balance = await test.step("Read remaining Annual balance", () =>
      myLeaves.getRemainingBalance(LeaveType.ANNUAL));

    const weeksAhead = DateUtils.randomInt(10, 12);
    test.info().annotations.push({ type: "weeksAhead", description: String(weeksAhead) });
    const start = DateUtils.weekdayWeeksAhead(weeksAhead);
    const overshoot = new Date(start);
    overshoot.setDate(overshoot.getDate() + balance + 7);
    const end = DateUtils.nextWeekday(overshoot);

    const modal = await test.step("Open the request form", () =>
      myLeaves.openRequestForm());

    await test.step("Select Annual leave and an over-balance range", async () => {
      await modal.selectType(LeaveType.ANNUAL);
      await modal.setDateRange(start, end);
    });

    await test.step("Projected balance is negative", async () => {
      expect(await modal.getBalanceAfter()).toBeLessThan(0);
    });

    await test.step("Both submit and save-as-draft are disabled", async () => {
      expect(await modal.isSubmitEnabled()).toBe(false);
      expect(await modal.isSaveDraftEnabled()).toBe(false);
    });
  });
});
