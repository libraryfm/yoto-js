import { describe, test, expect } from "bun:test";
import {
  YotoError,
  YotoAuthenticationError,
  YotoAPIError,
  YotoConnectionError,
  YotoRateLimitError,
} from "../src/error.ts";

describe("Error Classes", () => {
  test("YotoError should contain basic properties", () => {
    const error = new YotoError(
      "Test error",
      400,
      "test_error",
      "validation.field.invalid",
      "req_123",
    );
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.type).toBe("test_error");
    expect(error.code).toBe("validation.field.invalid");
    expect(error.requestId).toBe("req_123");
  });

  test("YotoAuthenticationError should have 401 status", () => {
    const error = new YotoAuthenticationError(
      "Invalid token",
      "invalid_token",
      "req_123",
    );
    expect(error.statusCode).toBe(401);
    expect(error.type).toBe("authentication_error");
    expect(error.code).toBe("invalid_token");
  });

  test("YotoRateLimitError should include retry after", () => {
    const error = new YotoRateLimitError(
      "Rate limit exceeded",
      60,
      "rate_limit_exceeded",
      "req_123",
    );
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
    expect(error.code).toBe("rate_limit_exceeded");
  });

  test("YotoConnectionError should not have status code", () => {
    const error = new YotoConnectionError("Connection failed");
    expect(error.statusCode).toBeUndefined();
    expect(error.type).toBe("connection_error");
  });
});

