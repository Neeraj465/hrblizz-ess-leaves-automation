import * as path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { EnvironmentConfig, EnvironmentName } from "./environment.types";

// Load .env BEFORE anything reads process.env
dotenvConfig({ path: path.resolve(__dirname, "../../.env") });

function normalizeEnvironment(raw?: string): EnvironmentName {
  const value = (raw ?? "DEV").trim().toUpperCase();
  if (value === "DEV" || value === "STAGING" || value === "PROD") {
    return value as EnvironmentName;
  }
  throw new Error(`Invalid ENVIRONMENT "${value}". Use one of: DEV, STAGING, PROD.`);
}

function requireVar(key: string): string {
  const v = process.env[key]?.trim();
  if (v) return v;
  throw new Error(`Missing required env variable: ${key}`);
}

function getEnvironmentConfig(rawEnvironment?: string): EnvironmentConfig {
  return {
    ENVIRONMENT: normalizeEnvironment(rawEnvironment),
    BASE_URL: requireVar("BASE_URL"),
    LOGIN_API_URL: process.env.LOGIN_API_URL?.trim() || undefined,
    USER_API_URL: process.env.USER_API_URL?.trim() || undefined,
    API_AUTH_HEADER: process.env.API_AUTH_HEADER?.trim() || undefined,
    API_AUTH_HEADER_ESS_API: process.env.API_AUTH_HEADER_ESS_API?.trim() || undefined,
    API_AUTH_HEADER_USER_API: process.env.API_AUTH_HEADER_USER_API?.trim() || undefined,
    EMPLOYEE: {
      username: requireVar("EMPLOYEE_USERNAME"),
      password: requireVar("EMPLOYEE_PASSWORD"),
    },
    MANAGER: {
      username: requireVar("MANAGER_USERNAME"),
      password: requireVar("MANAGER_PASSWORD"),
    },
  };
}

export default getEnvironmentConfig(process.env.ENVIRONMENT ?? process.env.ENV);
