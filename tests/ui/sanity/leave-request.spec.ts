import { test, expect } from "@tests/ui/base";
import { LeaveType, LeaveStatus } from "@support/enums";
import { DateUtils } from "@support/date-utils";
import { captureRequestId, withdrawLeaveRequest } from "@support/leave-request-api";

test.describe("Validate employee leave request - happy path", () => {
  // The leave created by the test; teardown withdraws it using the session's ids.
  let requestId: string | null = null;

  test.afterEach(async ({ employeeSession }) => {
    if (!requestId) return;
    const { legalEntityId, employeeId, sessionToken } = employeeSession;
    const { status, body } = await withdrawLeaveRequest(
      { legalEntityId, employeeId, requestId },
      sessionToken,
    );
    expect(status).toBe(200);
    expect(body.data.status).toBe("withdrawn");
    requestId = null;
  });

  test("TS-03: Annual leave request goes to Pending and reserves balance", async ({
    employeeSession,
  }) => {
    const { myLeaves, page } = employeeSession;

    const weeksAhead = DateUtils.randomInt(4, 6);
    test.info().annotations.push({ type: "weeksAhead", description: String(weeksAhead) });
    const start = DateUtils.weekdayWeeksAhead(weeksAhead);
    const end = DateUtils.nextWeekday(DateUtils.nextWeekday(start));
    const expectedDays = DateUtils.calendarDaysInRange(start, end);

    const balanceBefore = await test.step("Read starting Annual balance", () =>
      myLeaves.getRemainingBalance(LeaveType.ANNUAL));

    const modal = await test.step("Open the request form", () =>
      myLeaves.openRequestForm());

    await test.step("Choose Annual leave and the date range", async () => {
      await modal.selectType(LeaveType.ANNUAL);
      await modal.setDateRange(start, end);
    });

    await test.step("Form reflects the correct day-count and a valid balance", async () => {
      expect(await modal.getDayCount()).toBe(expectedDays);
      expect(await modal.getBalanceAfter()).toBe(balanceBefore - expectedDays);
      expect(await modal.isSubmitEnabled()).toBe(true);
    });

    await test.step("Submit the request", async () => {
      // Capture the requestId from the submissions POST so teardown can withdraw it.
      requestId = await captureRequestId(page, async () => {
        await modal.submit();
        await modal.clickConfirmButton();
      });
    });

    await test.step("Request appears as Pending", async () => {
      await expect(
        myLeaves.requestTile(LeaveType.ANNUAL, LeaveStatus.PENDING).first(),
      ).toBeVisible();
    });
  });
});
