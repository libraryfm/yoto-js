import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
  YotoDeviceAuth,
  YotoBrowserAuth,
  isTokenExpired,
  refreshAccessToken,
} from "../src/auth.ts";
import {
  YotoAuthenticationError,
  YotoConnectionError,
  YotoAPIError,
} from "../src/error.ts";

// Mock global fetch
const originalFetch = globalThis.fetch;

describe("YotoDeviceAuth", () => {
  let deviceAuth: YotoDeviceAuth;
  const clientId = "test_client_id";

  beforeEach(() => {
    deviceAuth = new YotoDeviceAuth(clientId);
    globalThis.fetch = originalFetch;
  });

  describe("initiateDeviceLogin", () => {
    test("should return device code response on success", async () => {
      const mockResponse = {
        device_code: "device_123",
        user_code: "ABCD-EFGH",
        verification_uri: "https://example.com/verify",
        verification_uri_complete: "https://example.com/verify?code=ABCD-EFGH",
        interval: 5,
        expires_in: 300,
      };

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        } as Response),
      ) as unknown as typeof fetch;

      const result = await deviceAuth.initiateDeviceLogin();
      expect(result.device_code).toBe("device_123");
      expect(result.user_code).toBe("ABCD-EFGH");
      expect(result.interval).toBe(5);
    });

    test("should throw YotoAuthenticationError on 4xx response", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          text: async () => "Invalid client",
        } as Response),
      ) as unknown as typeof fetch;

      await expect(deviceAuth.initiateDeviceLogin()).rejects.toThrow(
        YotoAuthenticationError,
      );
    });

    test("should throw YotoConnectionError on network failure", async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error("Network error")),
      ) as unknown as typeof fetch;

      await expect(deviceAuth.initiateDeviceLogin()).rejects.toThrow(
        YotoConnectionError,
      );
    });
  });

  describe("pollForToken", () => {
    test("should return tokens on successful authorization", async () => {
      const mockTokenResponse = {
        access_token: "access_123",
        refresh_token: "refresh_123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        } as Response),
      ) as unknown as typeof fetch;

      const result = await deviceAuth.pollForToken("device_123", 1);
      expect(result.access_token).toBe("access_123");
      expect(result.refresh_token).toBe("refresh_123");
    });

    test("should throw on expired_token error", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({
            error: "expired_token",
            error_description: "Device code has expired",
          }),
        } as Response),
      ) as unknown as typeof fetch;

      await expect(deviceAuth.pollForToken("device_123", 1)).rejects.toThrow(
        YotoAuthenticationError,
      );
    });

    test("should throw YotoAPIError on unexpected status", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response),
      ) as unknown as typeof fetch;

      await expect(deviceAuth.pollForToken("device_123", 1)).rejects.toThrow(
        YotoAPIError,
      );
    });
  });

  describe("refreshAccessToken utility", () => {
    test("should return new tokens on successful refresh", async () => {
      const mockTokenResponse = {
        access_token: "new_access_123",
        refresh_token: "new_refresh_123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response),
      ) as unknown as typeof fetch;

      const result = await refreshAccessToken(
        "https://login.yotoplay.com",
        clientId,
        "old_refresh_123",
        30000,
      );
      expect(result.access_token).toBe("new_access_123");
    });

    test("should throw YotoAuthenticationError on failed refresh", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          text: async () => "Invalid refresh token",
        } as Response),
      ) as unknown as typeof fetch;

      await expect(
        refreshAccessToken(
          "https://login.yotoplay.com",
          clientId,
          "invalid_refresh",
          30000,
        ),
      ).rejects.toThrow(YotoAuthenticationError);
    });
  });

  describe("isTokenExpired utility", () => {
    test("should return true for expired token", () => {
      const expiredToken = createMockJWT(Math.floor(Date.now() / 1000) - 3600);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    test("should return false for valid token", () => {
      const validToken = createMockJWT(Math.floor(Date.now() / 1000) + 3600);
      expect(isTokenExpired(validToken)).toBe(false);
    });

    test("should return true for token expiring within 30s", () => {
      const almostExpiredToken = createMockJWT(
        Math.floor(Date.now() / 1000) + 20,
      );
      expect(isTokenExpired(almostExpiredToken)).toBe(true);
    });

    test("should return true for malformed token", () => {
      expect(isTokenExpired("invalid.token")).toBe(true);
    });

    test("should return true for token without exp claim", () => {
      const noExpToken = createMockJWT(null);
      expect(isTokenExpired(noExpToken)).toBe(true);
    });
  });
});

describe("YotoBrowserAuth", () => {
  let browserAuth: YotoBrowserAuth;
  const clientId = "test_client_id";
  const redirectUri = "https://example.com/callback";

  beforeEach(() => {
    browserAuth = new YotoBrowserAuth(clientId, redirectUri);
    globalThis.fetch = originalFetch;
  });

  describe("generateAuthUrl", () => {
    test("should generate valid authorization URL with PKCE", async () => {
      const result = await browserAuth.generateAuthUrl();

      expect(result.url).toContain("https://login.yotoplay.com/authorize");
      expect(result.url).toContain(`client_id=${clientId}`);
      expect(result.url).toContain("code_challenge=");
      expect(result.url).toContain("code_challenge_method=S256");
      expect(result.codeVerifier).toBeDefined();
      expect(result.codeVerifier.length).toBeGreaterThan(0);
    });

    test("should generate different verifiers each time", async () => {
      const result1 = await browserAuth.generateAuthUrl();
      const result2 = await browserAuth.generateAuthUrl();

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
    });
  });

  describe("exchangeCodeForTokens", () => {
    test("should exchange authorization code for tokens", async () => {
      const mockTokenResponse = {
        access_token: "access_123",
        refresh_token: "refresh_123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockTokenResponse,
        } as Response),
      ) as unknown as typeof fetch;

      const result = await browserAuth.exchangeCodeForTokens(
        "auth_code_123",
        "verifier_123",
      );
      expect(result.access_token).toBe("access_123");
    });

    test("should throw YotoAuthenticationError on invalid code", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          text: async () => "Invalid authorization code",
        } as Response),
      ) as unknown as typeof fetch;

      await expect(
        browserAuth.exchangeCodeForTokens("invalid_code", "verifier_123"),
      ).rejects.toThrow(YotoAuthenticationError);
    });
  });

});

// Helper function to create mock JWT tokens
function createMockJWT(exp: number | null): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = exp !== null ? { exp } : {};

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${encodedHeader}.${encodedPayload}.signature`;
}
