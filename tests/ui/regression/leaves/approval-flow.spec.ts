import { test, expect } from "@tests/ui/base";
import { LeaveType, LeaveStatus } from "@support/enums";
import { DateUtils } from "@support/date-utils";
import env from "@support/environments/env.config";
import { userByUsername } from "@support/test-data";
import ApprovalsPage from "@pages/leaves/approvals.page";
import {
  createAndSubmitLeave,
  captureRequestId,
  cancelLeave,
  reviewRequest,
} from "@support/leave-request-api";

const EMPLOYEE_NAME = userByUsername(env.EMPLOYEE.username).name;

test.describe("Validate approval workflow", () => {
  // Per-test cleanup for the (approved) leave the test created.
  let teardown: (() => Promise<void>) | null = null;

  test.afterEach(async () => {
    if (!teardown) return;
    const run = teardown;
    teardown = null;
    await run();
  });

  test(
    "TS-04: Manager approves a pending employee request",
    async ({ employeeSession, managerSession }) => {
      const weeksAhead = DateUtils.randomInt(7, 9);
      test.info().annotations.push({ type: "weeksAhead", description: String(weeksAhead) });
      const start = DateUtils.weekdayWeeksAhead(weeksAhead);
      const end = DateUtils.nextWeekday(start);
      let approvals: ApprovalsPage;
      let shownRequestId: string;

      const requestId = await test.step("Employee submits an Annual request (API)", () =>
        createAndSubmitLeave(employeeSession, start, end));

      await test.step("Manager approves the submitted leave", async () => {
        // Reload the manager's page first so it picks up the request the
        // employee just submitted (this session loaded before that happened).
        await managerSession.home.reload();

        approvals = await managerSession.home.goToApprovals();
        shownRequestId = await approvals.getRequestIdFor(EMPLOYEE_NAME);
        expect(shownRequestId).toBeTruthy();
        await approvals.approveRequestFor(EMPLOYEE_NAME);
      });

      await test.step("Verify that request is now Approved", async () => {
        await approvals.switchToApprovedTab();
        expect(
          await approvals.isRequestApproved(EMPLOYEE_NAME, shownRequestId),
        ).toBe(true);
      });

      // Approved leaves are cancelled by the employee, then the manager approves
      // the cancellation.
      teardown = async () => {
        const cancel = await cancelLeave(employeeSession, requestId, start, end);
        expect(cancel.status).toBe(200);
        const review = await reviewRequest(managerSession, cancel.body.data.id);
        expect(review.status).toBe(200);
      };
    },
  );

  test(
    "TS-06: Manager's own request is auto-approved",
    async ({ managerSession }) => {
      const weeksAhead = DateUtils.randomInt(1, 7);
      test.info().annotations.push({ type: "weeksAhead", description: String(weeksAhead) });
      const start = DateUtils.weekdayWeeksAhead(weeksAhead);
      const end = DateUtils.nextWeekday(start);
      let requestId: string;

      await test.step("Manager submits their own Annual request", async () => {
        const modal = await managerSession.myLeaves.openRequestForm();
        await modal.selectType(LeaveType.ANNUAL);
        await modal.setDateRange(start, end);
        // Capture the requestId so teardown can cancel it.
        requestId = await captureRequestId(managerSession.page, async () => {
          await modal.submit();
          await modal.clickConfirmButton();
        });
      });

      await test.step("It is Approved without a separate approval step", async () => {
        const approvedLeaveDetails = await managerSession.myLeaves.getApprovedLeaveDetails(LeaveType.ANNUAL, requestId);
        await expect(approvedLeaveDetails).toBeVisible();
        await expect(approvedLeaveDetails
          .locator(managerSession.myLeaves.LOCATORS.approvedLeaveStatusTag)
        ).toContainText(LeaveStatus.ONGOING);

      });

      // The manager cancelling their own auto-approved leave is auto-approved,
        // so a single cancel call cleans it up.
        teardown = async () => {
          const cancel = await cancelLeave(managerSession, requestId, start, end);
          expect(cancel.status).toBe(200);
          expect(cancel.body.data.status).toBe("approved");
        };
    },
  );
});
