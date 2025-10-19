export interface YotoConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface YotoErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
  requestId?: string;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export interface AuthConfig {
  authBaseUrl?: string;
  apiAudience?: string;
  timeout?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  interval: number;
  expires_in: number;
}
