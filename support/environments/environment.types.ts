export type EnvironmentName = "DEV" | "STAGING" | "PROD";

export interface Credentials {
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  ENVIRONMENT: EnvironmentName;
  BASE_URL: string;
  LOGIN_API_URL?: string;
  USER_API_URL?: string;
  API_AUTH_HEADER?: string;
  API_AUTH_HEADER_ESS_API?: string;
  API_AUTH_HEADER_USER_API?: string;
  EMPLOYEE: Credentials;
  MANAGER: Credentials;
}
