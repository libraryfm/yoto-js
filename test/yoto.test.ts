import { describe, test, expect } from "bun:test";
import { Yoto } from "../src/yoto.ts";

describe("Yoto Client", () => {
  test("should initialize with access token", () => {
    const client = new Yoto({ accessToken: "test_access_token" });
    expect(client).toBeDefined();
  });

  test("should have all resource namespaces", () => {
    const client = new Yoto({ accessToken: "test_access_token" });
    expect(client.content).toBeDefined();
    expect(client.devices).toBeDefined();
    expect(client.family).toBeDefined();
    expect(client.familyLibraryGroups).toBeDefined();
    expect(client.icons).toBeDefined();
    expect(client.media).toBeDefined();
  });

  test("should accept custom configuration", () => {
    const client = new Yoto({
      accessToken: "test_access_token",
      baseUrl: "https://custom.api.com",
      timeout: 5000,
    });
    expect(client).toBeDefined();
  });

  test("should throw error when no auth provided", () => {
    expect(() => new Yoto({} as any)).toThrow();
  });

  test("should throw error when both accessToken and auth provided", () => {
    expect(() => 
      new Yoto({
        accessToken: "test",
        auth: { getAccessToken: async () => "test" },
      })
    ).toThrow();
  });
});

