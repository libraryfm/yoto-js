import { RefreshableAuthProvider } from "./auth-provider.ts";
import {
  YotoAPIError,
  YotoAuthenticationError,
  YotoConnectionError,
} from "./error.ts";
import type {
  AuthConfig,
  DeviceCodeResponse,
  TokenResponse,
} from "./types/common.ts";

const DEFAULT_AUTH_BASE_URL = "https://login.yotoplay.com";
const DEFAULT_API_AUDIENCE = "https://api.yotoplay.com";
const DEFAULT_TIMEOUT = 30000;

/**
 * Base64URL encoding without padding
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Generate random string for PKCE
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer).slice(0, length);
}

/**
 * Generate PKCE challenge from verifier
 */
async function generatePKCEChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

/**
 * Decode JWT payload without verification
 */
export function decodeJWT(token: string): {
  exp?: number;
  [key: string]: unknown;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const base64Url = parts[1];
    if (!base64Url) {
      throw new Error("Invalid JWT format");
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error}`);
  }
}

/**
 * Check if token is expired (with 30s buffer)
 */
export function isTokenExpired(accessToken: string): boolean {
  try {
    const decoded = decodeJWT(accessToken);
    if (!decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  authBaseUrl: string,
  clientId: string,
  refreshToken: string,
  timeout: number,
): Promise<TokenResponse> {
  const url = `${authBaseUrl}/oauth/token`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new YotoAuthenticationError(`Token refresh failed: ${errorText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_in: data.expires_in as number,
      token_type: data.token_type as string,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof YotoAuthenticationError) {
      throw error;
    }
    throw new YotoConnectionError(`Token refresh request failed: ${error}`);
  }
}

/**
 * Authentication client for device code (CLI/headless) flow
 */
export class YotoDeviceAuth {
  private readonly clientId: string;
  private readonly authBaseUrl: string;
  private readonly apiAudience: string;
  private readonly timeout: number;

  constructor(clientId: string, config?: AuthConfig) {
    this.clientId = clientId;
    this.authBaseUrl = config?.authBaseUrl || DEFAULT_AUTH_BASE_URL;
    this.apiAudience = config?.apiAudience || DEFAULT_API_AUDIENCE;
    this.timeout = config?.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Create an auth provider with automatic token refresh
   */
  createProvider(tokens: TokenResponse): RefreshableAuthProvider {
    return new RefreshableAuthProvider(
      this.authBaseUrl,
      this.clientId,
      this.timeout,
      tokens,
    );
  }

  /**
   * Initialize device login and get verification URL/code
   */
  async initiateDeviceLogin(): Promise<DeviceCodeResponse> {
    const url = `${this.authBaseUrl}/oauth/device/code`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          scope: "openid profile email offline_access",
          audience: this.apiAudience,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new YotoAuthenticationError(
          `Device login initiation failed: ${errorText}`,
        );
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        device_code: data.device_code as string,
        user_code: data.user_code as string,
        verification_uri: data.verification_uri as string,
        verification_uri_complete: data.verification_uri_complete as string,
        interval: (data.interval as number) || 5,
        expires_in: (data.expires_in as number) || 300,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof YotoAuthenticationError) {
        throw error;
      }
      throw new YotoConnectionError(`Device login request failed: ${error}`);
    }
  }

  /**
   * Poll for tokens after user completes authorization
   */
  async pollForToken(deviceCode: string, interval = 5): Promise<TokenResponse> {
    const url = `${this.authBaseUrl}/oauth/token`;
    let intervalMs = interval * 1000;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            device_code: deviceCode,
            client_id: this.clientId,
            audience: this.apiAudience,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as Record<string, unknown>;
          return {
            access_token: data.access_token as string,
            refresh_token: data.refresh_token as string,
            expires_in: data.expires_in as number,
            token_type: data.token_type as string,
          };
        }

        if (response.status === 403) {
          const errorData = (await response.json()) as Record<string, unknown>;

          if (errorData.error === "authorization_pending") {
            await this.sleep(intervalMs);
            continue;
          }

          if (errorData.error === "slow_down") {
            intervalMs += 5000;
            await this.sleep(intervalMs);
            continue;
          }

          if (errorData.error === "expired_token") {
            throw new YotoAuthenticationError(
              "Device code has expired. Please restart the device login process.",
            );
          }

          throw new YotoAuthenticationError(
            (errorData.error_description as string) ||
              (errorData.error as string),
          );
        }

        throw new YotoAPIError(
          `Token request failed: ${response.statusText}`,
          response.status,
        );
      } catch (error) {
        clearTimeout(timeoutId);
        if (
          error instanceof YotoAuthenticationError ||
          error instanceof YotoAPIError
        ) {
          throw error;
        }
        throw new YotoConnectionError(`Token polling failed: ${error}`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Authentication client for browser-based PKCE flow
 */
export class YotoBrowserAuth {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly authBaseUrl: string;
  private readonly apiAudience: string;
  private readonly timeout: number;

  constructor(clientId: string, redirectUri: string, config?: AuthConfig) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.authBaseUrl = config?.authBaseUrl || DEFAULT_AUTH_BASE_URL;
    this.apiAudience = config?.apiAudience || DEFAULT_API_AUDIENCE;
    this.timeout = config?.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Create an auth provider with automatic token refresh
   */
  createProvider(tokens: TokenResponse): RefreshableAuthProvider {
    return new RefreshableAuthProvider(
      this.authBaseUrl,
      this.clientId,
      this.timeout,
      tokens,
    );
  }

  /**
   * Generate authorization URL with PKCE challenge
   */
  async generateAuthUrl(): Promise<{ url: string; codeVerifier: string }> {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generatePKCEChallenge(codeVerifier);

    const params = new URLSearchParams({
      audience: this.apiAudience,
      scope: "openid profile email offline_access",
      response_type: "code",
      client_id: this.clientId,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: this.redirectUri,
    });

    const url = `${this.authBaseUrl}/authorize?${params.toString()}`;

    return { url, codeVerifier };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse> {
    const url = `${this.authBaseUrl}/oauth/token`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.clientId,
          code_verifier: codeVerifier,
          code: code,
          redirect_uri: this.redirectUri,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new YotoAuthenticationError(`Code exchange failed: ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        access_token: data.access_token as string,
        refresh_token: data.refresh_token as string,
        expires_in: data.expires_in as number,
        token_type: data.token_type as string,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof YotoAuthenticationError) {
        throw error;
      }
      throw new YotoConnectionError(`Code exchange request failed: ${error}`);
    }
  }
}
