import { APIRequestContext, request } from "@playwright/test";
import env from "@support/environments/env.config";

/**
 *  Request body accepted by POST /login/credential
 **/
export interface LoginPayload {
  loginUsername: string;
  loginPassword: string;
  unblockToken?: string | null;
}

/** The session data carried by a role fixture for building backend requests. */
export interface ApiSession {
  sessionToken: string;
  employeeId: number;
  legalEntityId: number;
}

/**
 * Build a request context pointed at the auth service.
 * Throws early (with a clear message) if LOGIN_API_URL is not configured.
 *
 * @param options.includeAuthHeader  When false, the Basic client token
 *   (authorization header) is omitted, used to test the unauthenticated case.
 *   Defaults to true.
 */
export async function newAuthApiContext(
  options: { includeAuthHeader?: boolean } = {},
): Promise<APIRequestContext> {
  const { includeAuthHeader = true } = options;
  if (!env.LOGIN_API_URL) {
    throw new Error(
      "LOGIN_API_URL is not set. Add it to your .env to run the API tests.",
    );
  }
  return request.newContext({
    baseURL: env.LOGIN_API_URL,
    extraHTTPHeaders: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      ...(includeAuthHeader && env.API_AUTH_HEADER
        ? { authorization: env.API_AUTH_HEADER }
        : {}),
    },
    ignoreHTTPSErrors: true,
  });
}
