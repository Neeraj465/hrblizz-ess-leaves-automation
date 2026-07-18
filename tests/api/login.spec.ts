import { test, expect, APIRequestContext } from "@playwright/test";
import { newAuthApiContext, LoginPayload } from "@support/api-utils";
import { API_ROUTES } from "@support/api-routes";
import env from "@support/environments/env.config";
import { expectLoginResponseSchema } from "@support/responseSchema/login.schema";

test.describe("Validate login api", () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await newAuthApiContext();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  const login = (options: { username: string; password: string }) =>
    api.post(API_ROUTES.loginCredential, {
      data: {
        loginUsername: options.username,
        loginPassword: options.password,
        unblockToken: null,
      } satisfies LoginPayload,
    });

  test("Positive: valid credentials are accepted", async () => {
    const response = await test.step("POST valid employee credentials", () =>
      login({ username: env.EMPLOYEE.username, password: env.EMPLOYEE.password }));

    await test.step("Responds 200 with a payload matching the login schema", async () => {
      expect(response.ok()).toBe(true);
      expect(response.status()).toEqual(200);
      const body = await response.json();
      // Validate the response body against the expected schema
      expectLoginResponseSchema(body);
    });
  });

  test("Negative: wrong password is rejected", async () => {
    const response = await test.step("POST a valid username with a bad password", () =>
      login({ username: env.EMPLOYEE.username, password: "definitely-wrong-password" }));

    await test.step("Responds 401 and is not authenticated", async () => {
      expect(response.ok()).toBe(false);
      expect(response.status()).toEqual(401);
    });
  });

  test("Negative: unknown user is rejected", async () => {
    const response = await test.step("POST a non-existent account", () =>
      login({ username: "no-such-user@example.com", password: "irrelevant" }));

    await test.step("Responds 401", async () => {
      expect(response.ok()).toBe(false);
      expect(response.status()).toEqual(401);
    });
  });

  test("Negative: empty body is handled gracefully", async () => {
    const response = await test.step("POST an empty JSON body", () =>
      api.post(API_ROUTES.loginCredential, { data: {} }));

    await test.step("Responds with a client error", async () => {
      expect(response.status()).toEqual(400);
    });
  });

  test("Negative: missing authorization header is rejected", async () => {
    // A context built without the Basic client token, so no authorization header is sent.
    const noAuthApi = await newAuthApiContext({ includeAuthHeader: false });
    try {
      const response = await test.step(
        "POST valid credentials but no authorization header",
        () =>
          noAuthApi.post(API_ROUTES.loginCredential, {
            data: {
              loginUsername: env.EMPLOYEE.username,
              loginPassword: env.EMPLOYEE.password,
              unblockToken: null,
            } satisfies LoginPayload,
          }),
      );

      await test.step("Responds 401 (full authentication required)", async () => {
        expect(response.ok()).toBe(false);
        expect(response.status()).toEqual(401);
      });
    } finally {
      await noAuthApi.dispose();
    }
  });
});
