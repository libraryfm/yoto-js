import { beforeEach, describe, expect, mock, test } from "bun:test";
import { DevicesResource } from "../src/resources/devices.ts";
import type { HttpClient } from "../src/http-client.ts";

describe("DevicesResource", () => {
  let devices: DevicesResource;
  let mockClient: HttpClient;

  beforeEach(() => {
    mockClient = {
      request: mock(() => Promise.resolve({})),
    } as unknown as HttpClient;
    devices = new DevicesResource(mockClient);
  });

  test("list should fetch all devices", async () => {
    const mockDevices = {
      devices: [
        { id: "dev1", name: "Player 1" },
        { id: "dev2", name: "Player 2" },
      ],
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockDevices,
    );

    const result = await devices.list();

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/devices/mine",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(mockDevices.devices);
  });

  test("getStatus should fetch device status", async () => {
    const mockStatus = {
      online: true,
      battery: 85,
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockStatus,
    );

    const result = await devices.getStatus("dev1");

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/dev1/status",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(mockStatus);
  });

  test("getConfig should fetch device config", async () => {
    const mockConfig = {
      volume: 50,
      ambientLightColor: "blue",
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockConfig,
    );

    const result = await devices.getConfig("dev1");

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/dev1/config",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(mockConfig);
  });

  test("updateConfig should patch config changes", async () => {
    const updates = { volume: 75 };

    await devices.updateConfig("dev1", updates);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/dev1/config",
      expect.objectContaining({
        method: "PATCH",
        body: updates,
      }),
    );
  });

  test("sendCommand should post command", async () => {
    const command = { command: "play" };

    await devices.sendCommand("dev1", command);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/dev1/command",
      expect.objectContaining({
        method: "POST",
        body: command,
      }),
    );
  });

  test("updateShortcuts should put shortcuts config", async () => {
    const shortcuts = {
      shortcuts: [
        { button: 1, contentId: "abc" },
        { button: 2, contentId: "def" },
      ],
    };

    await devices.updateShortcuts("dev1", shortcuts);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/device-v2/dev1/shortcuts",
      expect.objectContaining({
        method: "PUT",
        body: shortcuts,
      }),
    );
  });
});

