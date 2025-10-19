import { describe, test, expect } from "bun:test";
import {
  constructEvent,
  generateTestHeaderString,
} from "../src/webhooks.ts";

describe("Webhook Utilities", () => {
  const secret = "test_secret";
  const payload = { id: "evt_123", type: "content.created", data: {} };

  test("should generate valid test signature", () => {
    const header = generateTestHeaderString({
      payload: JSON.stringify(payload),
      secret,
    });
    expect(header).toContain("t=");
    expect(header).toContain("v1=");
  });

  test("should verify valid webhook signature", () => {
    const payloadString = JSON.stringify(payload);
    const header = generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    const event = constructEvent(payloadString, header, secret);
    expect(event.id).toBe("evt_123");
    expect(event.type).toBe("content.created");
  });

  test("should reject invalid signature", () => {
    const payloadString = JSON.stringify(payload);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const header = `t=${currentTimestamp},v1=invalid_signature`;

    expect(() => {
      constructEvent(payloadString, header, secret);
    }).toThrow("Signature verification failed");
  });

  test("should reject expired timestamp", () => {
    const payloadString = JSON.stringify(payload);
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const header = generateTestHeaderString({
      payload: payloadString,
      secret,
      timestamp: oldTimestamp,
    });

    expect(() => {
      constructEvent(payloadString, header, secret);
    }).toThrow("Timestamp outside tolerance window");
  });

  test("should accept custom tolerance", () => {
    const payloadString = JSON.stringify(payload);
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    const header = generateTestHeaderString({
      payload: payloadString,
      secret,
      timestamp: oldTimestamp,
    });

    const event = constructEvent(payloadString, header, secret, {
      tolerance: 500,
    });
    expect(event.id).toBe("evt_123");
  });
});

