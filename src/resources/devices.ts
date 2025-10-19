import type {
  Device,
  DeviceConfig,
  DeviceStatus,
  SendCommandRequest,
  UpdateDeviceConfigRequest,
  UpdateShortcutsRequest,
} from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class DevicesResource extends YotoResource {
  /**
   * List all devices
   * @returns Array of devices
   */
  async list(): Promise<Device[]> {
    const response = await this.get<{ devices: Device[] }>(
      "/device-v2/devices/mine",
    );
    return response.devices;
  }

  /**
   * Get device status
   * @param deviceId - The device ID
   * @returns Device status
   */
  async getStatus(deviceId: string): Promise<DeviceStatus> {
    return this.get<DeviceStatus>(`/device-v2/${deviceId}/status`);
  }

  /**
   * Get device configuration
   * @param deviceId - The device ID
   * @returns Device configuration
   */
  async getConfig(deviceId: string): Promise<DeviceConfig> {
    return this.get<DeviceConfig>(`/device-v2/${deviceId}/config`);
  }

  /**
   * Update device configuration
   * @param deviceId - The device ID
   * @param data - Configuration update data
   * @returns Updated device configuration
   */
  async updateConfig(
    deviceId: string,
    data: UpdateDeviceConfigRequest,
  ): Promise<DeviceConfig> {
    return this.patch<DeviceConfig>(`/device-v2/${deviceId}/config`, data);
  }

  /**
   * Send command to device
   * @param deviceId - The device ID
   * @param data - Command to send
   */
  async sendCommand(deviceId: string, data: SendCommandRequest): Promise<void> {
    await this.post<void>(`/device-v2/${deviceId}/command`, data);
  }

  /**
   * Update device shortcuts (beta)
   * @param deviceId - The device ID
   * @param data - Shortcuts configuration
   */
  async updateShortcuts(
    deviceId: string,
    data: UpdateShortcutsRequest,
  ): Promise<void> {
    await this.put<void>(`/device-v2/${deviceId}/shortcuts`, data);
  }
}
