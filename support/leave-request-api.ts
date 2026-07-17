import { request, Page } from "@playwright/test";
import env from "@support/environments/env.config";
import { API_ROUTES } from "@support/api-routes";
import { ANNUAL_LEAVE } from "@support/constants/leaves.constants";

/** Matches the submissions endpoint; group 3 is the requestId. */
const SUBMISSIONS_URL =
  /\/request\/legal-entities\/(\d+)\/employees\/(\d+)\/requests\/(\d+)\/submissions/;

/** Ids that identify a single leave request's submissions endpoint. */
export interface LeaveRequestRef {
  legalEntityId: string | number;
  employeeId: string | number;
  requestId: string | number;
}

/** The session data needed to call the backend as a given user. */
export interface SessionRef {
  sessionToken: string;
  employeeId: string | number;
  legalEntityId: string | number;
}

/** HTTP status plus the parsed response body. */
export interface ApiResult {
  status: number;
  body: any;
}

/** Format a Date as the `YYYY-MM-DD` the API expects (local calendar day). */
function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The create/cancel request body for an Annual leave over the given range. */
function annualLeaveBody(start: Date, end: Date) {
  return {
    type: "leave",
    requestTypeId: ANNUAL_LEAVE.requestTypeId,
    entity: {
      leaveRegulationId: ANNUAL_LEAVE.leaveRegulationId,
      startDate: isoDate(start),
      endDate: isoDate(end),
      notes: null,
      amountType: "days",
    },
    createdFromRequestId: null,
    attachments: [],
  };
}

/**
 * Run the submit action and return the requestId from the `POST .../submissions`
 * call the app fires. legalEntityId/employeeId come from the session, so only
 * this per-leave id needs capturing.
 *
 * @param page   The page that will fire the submissions request.
 * @param submit The action that submits the leave (e.g. click Request + Confirm).
 */
export async function captureRequestId(page: Page, submit: () => Promise<void>): Promise<string> {
  const post = page.waitForRequest(
    (req) => req.method() === "POST" && SUBMISSIONS_URL.test(req.url()),
  );
  await submit();
  const requestId = (await post).url().match(SUBMISSIONS_URL)![3];
  return requestId;
}

/** A user-access-gateway request context authenticated with the given session token. */
function userApiContext(sessionToken: string) {
  return request.newContext({
    baseURL: env.USER_API_URL,
    extraHTTPHeaders: {
      authorization: env.API_AUTH_HEADER_USER_API!,
      "content-type": "application/json",
      accept: "application/json, text/plain, */*",
      cookie: `X-Session-Token=${sessionToken}`,
    },
    ignoreHTTPSErrors: true,
  });
}

/**
 * Withdraw a still-pending leave request (DELETE its submission). Used for teardown.
 *
 * @param ref          Ids of the request (legalEntityId/employeeId from the session).
 * @param sessionToken Session token from the owning session.
 */
export async function withdrawLeaveRequest(
  ref: LeaveRequestRef,
  sessionToken: string,
): Promise<ApiResult> {
  const api = await userApiContext(sessionToken);
  try {
    const res = await api.delete(
      API_ROUTES.leaveRequestSubmissions(ref.legalEntityId, ref.employeeId, ref.requestId),
    );
    return { status: res.status(), body: await res.json() };
  } finally {
    await api.dispose();
  }
}

/**
 * Create and submit an Annual leave request entirely via the API (the 3 calls
 * the app makes): create -> update -> submit. Returns the new requestId.
 *
 * @param session The owner's session (token + ids).
 * @param start   Leave start date.
 * @param end     Leave end date.
 */
export async function createAndSubmitLeave(
  session: SessionRef,
  start: Date,
  end: Date,
): Promise<string> {
  const { legalEntityId, employeeId } = session;
  const api = await userApiContext(session.sessionToken);
  try {
    const body = annualLeaveBody(start, end);

    // 1. Create the request
    const createRes = await api.post(API_ROUTES.leaveRequests(legalEntityId, employeeId), { data: body });
    if (!createRes.ok()) throw new Error(`create request failed: ${createRes.status()}`);
    const requestId = (await createRes.json()).data.id;

    // 2. Update the draft with the same entity.
    const updateRes = await api.put(API_ROUTES.leaveRequest(legalEntityId, employeeId, requestId), { data: body });
    if (!updateRes.ok()) throw new Error(`update request failed: ${updateRes.status()}`);

    // 3. Submit it
    const submitRes = await api.post(API_ROUTES.leaveRequestSubmissions(legalEntityId, employeeId, requestId));
    if (!submitRes.ok()) throw new Error(`submit request failed: ${submitRes.status()}`);

    return String(requestId);
  } finally {
    await api.dispose();
  }
}

/**
 * Cancel a request (used for approved leaves). Returns the response; the
 * cancellation is itself a request whose id is `body.data.id` and whose status
 * is "approved" for auto-workflows or "pending" when a reviewer must approve it.
 *
 * @param session   The owner's session.
 * @param requestId The request to cancel.
 * @param start/end The leave's dates (the cancel body mirrors the leave entity).
 */
export async function cancelLeave(
  session: SessionRef,
  requestId: string | number,
  start: Date,
  end: Date,
): Promise<ApiResult> {
  const api = await userApiContext(session.sessionToken);
  try {
    const res = await api.put(
      API_ROUTES.leaveRequestCancel(session.legalEntityId, session.employeeId, requestId),
      { data: annualLeaveBody(start, end) },
    );
    return { status: res.status(), body: await res.json() };
  } finally {
    await api.dispose();
  }
}

/**
 * Review (approve/reject) a request as the given reviewer.
 *
 * @param reviewer  The reviewer's session; reviewer.employeeId is the reviewerId.
 * @param requestId The request under review (e.g. a cancellation request).
 * @param status    Review decision. Defaults to "approved".
 */
export async function reviewRequest(
  reviewer: SessionRef,
  requestId: string | number,
  status = "approved",
): Promise<ApiResult> {
  const api = await userApiContext(reviewer.sessionToken);
  try {
    const res = await api.put(
      API_ROUTES.requestReviews(reviewer.employeeId, requestId),
      { data: { comment: "", status } },
    );
    return { status: res.status(), body: await res.json() };
  } finally {
    await api.dispose();
  }
}
