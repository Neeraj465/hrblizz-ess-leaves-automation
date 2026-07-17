import { z } from "zod";

/**
 * Schema skeleton for a successful `POST /login/credential` response.
 * Captured from a real DEV response. Declare the shape once here; the test
 * validates the whole body against it in a single call.
 */
const LegalEntitySchema = z.object({
  id: z.number(),
  uuid: z.string(),
  legalName: z.string(),
  brandName: z.string(),
  code: z.string(),
  essEulaAutoAccept: z.boolean(),
  logoFileAttachmentToken: z.string().nullable(),
  essAccessibleDays: z.number(),
});

const EmployeeSchema = z.object({
  id: z.number(),
  uuid: z.string().nullable(),
  legalEntity: LegalEntitySchema,
  name: z.string(),
  referenceCode: z.string(),
  hireDate: z.string(),
  lastWorkingDate: z.string().nullable(),
  lastEssAccessDate: z.string().nullable(),
  assignment: z.string(),
});

export const LoginResponseSchema = z.object({
  loginUsername: z.string(),
  credentialToken: z.string(),
  employees: z.array(EmployeeSchema).min(1), //Expect at least one employee to be returned for a valid login
  tfaToken: z.string().nullable(),
});

/** Response type, inferred from the schema — no separate interface to maintain. */
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Validate the whole body against the login schema and return it typed.
 * Throws a descriptive error if any field is missing or has the wrong type.
 * @param body The response body to validate.
 */
export function expectLoginResponseSchema(body: unknown): LoginResponse {
  return LoginResponseSchema.parse(body);
}
