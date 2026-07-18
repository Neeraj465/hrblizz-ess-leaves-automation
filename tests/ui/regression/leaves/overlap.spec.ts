import { test, expect } from "@tests/ui/base";
import { LeaveType, LeaveStatus } from "@support/enums";
import { DateUtils } from "@support/date-utils";
import { captureRequestId, withdrawLeaveRequest } from "@support/leave-request-api";

test.describe("Validate Overlapping leaves (same type)", () => {
  // Set only when this test seeds a request itself, so teardown withdraws it.
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

  test("TS-09: A second overlapping Annual request is blocked", async ({
    employeeSession,
  }) => {
    const { myLeaves, page } = employeeSession;

    const weeksAhead = DateUtils.randomInt(1, 3);
    test.info().annotations.push({ type: "weeksAhead", description: String(weeksAhead) });
    const start = DateUtils.weekdayWeeksAhead(weeksAhead);
    const end = DateUtils.nextWeekday(DateUtils.nextWeekday(start));

    await test.step("Ensure an Annual request exists in the target window", async () => {
      if (!(await myLeaves.hasRequest(LeaveType.ANNUAL, LeaveStatus.PENDING))) {
        const seed = await myLeaves.openRequestForm();
        await seed.selectType(LeaveType.ANNUAL);
        await seed.setDateRange(start, end);
        // Capture the seed we create so teardown can withdraw it.
        requestId = await captureRequestId(page, async () => {
          await seed.submit();
          await seed.clickConfirmButton();
        });
        await expect(
          myLeaves.requestTile(LeaveType.ANNUAL, LeaveStatus.PENDING).first(),
        ).toBeVisible();
      }
    });

    const modal = await test.step("Open a new request over the same window", async () => {
      const requestModal = await myLeaves.openRequestForm();
      await requestModal.selectType(LeaveType.ANNUAL);
      await requestModal.setDateRange(start, end);
      return requestModal;
    });

    await test.step("Overlap banner is shown", async () => {
      expect(await modal.isOverlapWarningVisible()).toBe(true);
    });

    await test.step("Submitting the overlap is prevented", async () => {
      expect(await modal.isSubmitEnabled()).toBe(false);
    });
  });
});
