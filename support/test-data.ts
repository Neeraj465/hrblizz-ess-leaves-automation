import testData from "@support/test-data.json";

export interface TestUser {
  username: string;
  name: string;
}

const USERS: TestUser[] = Object.values(testData.users);

/**
 * Resolve a registered user's display name by their login username.
 * Pass the value from `.env` (e.g. `env.EMPLOYEE.username`) so the name
 * always tracks whoever is configured, rather than a hardcoded string.
 */
export function userByUsername(username: string): TestUser {
  const user = USERS.find((u) => u.username === username);
  if (!user) {
    throw new Error(
      `No user in test-data.json matches username "${username}". ` +
        `Add them to support/test-data.json.`,
    );
  }
  return user;
}
