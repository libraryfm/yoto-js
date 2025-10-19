import { isTokenExpired, refreshAccessToken } from "./auth.ts";
import type { TokenResponse } from "./types/common.ts";

/**
 * Interface for authentication providers
 * Providers are responsible for obtaining valid access tokens
 */
export interface AuthProvider {
  /**
   * Get a valid access token
   * Implementations should handle token refresh automatically
   */
  getAccessToken(): Promise<string>;
}

/**
 * Static token provider - no automatic refresh
 * Use this when you have a long-lived token or handle refresh externally
 */
export class StaticTokenProvider implements AuthProvider {
  constructor(private readonly accessToken: string) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

/**
 * Refreshable auth provider with automatic token refresh
 * Works with both device and browser auth flows
 */
export class RefreshableAuthProvider implements AuthProvider {
  private tokens: TokenResponse;

  constructor(
    private readonly authBaseUrl: string,
    private readonly clientId: string,
    private readonly timeout: number,
    tokens: TokenResponse,
  ) {
    this.tokens = tokens;
  }

  async getAccessToken(): Promise<string> {
    if (isTokenExpired(this.tokens.access_token)) {
      this.tokens = await refreshAccessToken(
        this.authBaseUrl,
        this.clientId,
        this.tokens.refresh_token,
        this.timeout,
      );
    }
    return this.tokens.access_token;
  }
}
