/**
 * Read-Only Validations
 * 
 * Tests read-only operations for devices, icons, and media resources.
 * These endpoints don't have full CRUD lifecycles or require special permissions.
 * 
 * Run with: bun run test/e2e/read-only-validations.ts
 * Required: YOTO_ACCESS_TOKEN environment variable
 */

import { Yoto } from "../../src/index.ts";
import type { ValidationResult } from "./validation-utils.ts";
import { printResults, validateObjectShape } from "./validation-utils.ts";

const results: ValidationResult[] = [];

async function runValidations(yoto: Yoto): Promise<void> {
  console.log("Starting Read-Only Validations...\n");

  // ===== DEVICES =====
  console.log("Testing Devices...");
  
  // Test 1: devices.list()
  console.log("1. Listing devices...");
  try {
    const devices = await yoto.devices.list();
    console.log(`   Found ${devices.length} devices`);

    const errors: string[] = [];
    if (!Array.isArray(devices)) {
      errors.push("Response should be an array");
    } else if (devices.length > 0 && devices[0]) {
      const deviceErrors = validateObjectShape(
        devices[0],
        {
          deviceId: "string",
          name: "string",
          online: { optional: true, type: "boolean" },
          description: { optional: true, type: "string" },
          releaseChannel: { optional: true, type: "string" },
        },
        "Device"
      );
      errors.push(...deviceErrors);
    }

    results.push({
      endpoint: "/device-v2/devices/mine",
      method: "GET (devices.list)",
      success: errors.length === 0,
      errors,
      response: devices[0],
    });
  } catch (error) {
    results.push({
      endpoint: "/device-v2/devices/mine",
      method: "GET (devices.list)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 2: devices.getStatus()
  console.log("2. Getting device status...");
  try {
    const devices = await yoto.devices.list();
    if (devices.length > 0 && devices[0]) {
      const deviceId = devices[0].deviceId;
      const status = await yoto.devices.getStatus(deviceId);
      console.log(`   Got status for device: ${deviceId}`);

      const errors = validateObjectShape(
        status,
        {
          isOnline: "boolean",
          batteryLevel: { optional: true, type: "number" },
          charging: { optional: true, type: "boolean" },
        },
        "DeviceStatus"
      );

      results.push({
        endpoint: `/device-v2/${deviceId}/status`,
        method: "GET (devices.getStatus)",
        success: errors.length === 0,
        errors,
        response: status,
      });
    } else {
      results.push({
        endpoint: "/device-v2/{deviceId}/status",
        method: "GET (devices.getStatus)",
        success: true,
        errors: ["SKIPPED - No devices available"],
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/device-v2/{deviceId}/status",
      method: "GET (devices.getStatus)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 3: devices.getConfig()
  console.log("3. Getting device config...");
  try {
    const devices = await yoto.devices.list();
    if (devices.length > 0 && devices[0]) {
      const deviceId = devices[0].deviceId;
      const config = await yoto.devices.getConfig(deviceId);
      console.log(`   Got config for device: ${deviceId}`);

      const errors = validateObjectShape(
        config,
        {
          nightlightColor: { optional: true, type: "string" },
          maxVolume: { optional: true, type: "number" },
          ambientColor: { optional: true, type: "string" },
        },
        "DeviceConfig"
      );

      results.push({
        endpoint: `/device-v2/${deviceId}/config`,
        method: "GET (devices.getConfig)",
        success: errors.length === 0,
        errors,
        response: config,
      });
    } else {
      results.push({
        endpoint: "/device-v2/{deviceId}/config",
        method: "GET (devices.getConfig)",
        success: true,
        errors: ["SKIPPED - No devices available"],
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/device-v2/{deviceId}/config",
      method: "GET (devices.getConfig)",
      success: false,
      errors: [String(error)],
    });
  }

  // ===== ICONS =====
  console.log("\nTesting Icons...");

  // Test 4: icons.listPublic()
  console.log("4. Listing public icons...");
  try {
    const iconsResponse = await yoto.icons.listPublic();
    console.log(`   Found ${iconsResponse.displayIcons.length} public icons`);

    const errors = validateObjectShape(
      iconsResponse,
      {
        displayIcons: "array",
      },
      "ListIconsResponse"
    );

    if (iconsResponse.displayIcons.length > 0 && iconsResponse.displayIcons[0]) {
      const iconErrors = validateObjectShape(
        iconsResponse.displayIcons[0],
        {
          mediaId: "string",
          userId: "string",
          createdAt: "string",
          displayIconId: "string",
          url: "string",
          new: { optional: true, type: "boolean" },
          publicTags: { optional: true, type: "array" },
          title: { optional: true, type: "string" },
          public: { optional: true, type: "boolean" },
        },
        "DisplayIcon"
      );
      errors.push(...iconErrors);
    }

    results.push({
      endpoint: "/media/displayIcons/user/yoto",
      method: "GET (icons.listPublic)",
      success: errors.length === 0,
      errors,
      response: iconsResponse,
    });
  } catch (error) {
    results.push({
      endpoint: "/media/displayIcons/user/yoto",
      method: "GET (icons.listPublic)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 5: icons.listUser()
  console.log("5. Listing user icons...");
  try {
    const iconsResponse = await yoto.icons.listUser();
    console.log(`   Found ${iconsResponse.displayIcons.length} user icons`);

    const errors = validateObjectShape(
      iconsResponse,
      {
        displayIcons: "array",
      },
      "ListIconsResponse"
    );

    if (iconsResponse.displayIcons.length > 0 && iconsResponse.displayIcons[0]) {
      const iconErrors = validateObjectShape(
        iconsResponse.displayIcons[0],
        {
          mediaId: "string",
          userId: "string",
          createdAt: "string",
          displayIconId: "string",
          url: "string",
          new: { optional: true, type: "boolean" },
          publicTags: { optional: true, type: "array" },
          title: { optional: true, type: "string" },
          public: { optional: true, type: "boolean" },
        },
        "DisplayIcon"
      );
      errors.push(...iconErrors);
    }

    results.push({
      endpoint: "/media/displayIcons/user/me",
      method: "GET (icons.listUser)",
      success: errors.length === 0,
      errors,
      response: iconsResponse,
    });
  } catch (error) {
    results.push({
      endpoint: "/media/displayIcons/user/me",
      method: "GET (icons.listUser)",
      success: false,
      errors: [String(error)],
    });
  }

  // ===== MEDIA =====
  console.log("\nTesting Media...");

  // Test 6: media.getAudioUploadUrl()
  console.log("6. Getting audio upload URL...");
  try {
    const uploadResponse = await yoto.media.getAudioUploadUrl();
    console.log(`   Got upload URL`);

    const errors = validateObjectShape(
      uploadResponse,
      {
        upload: "object",
      },
      "AudioUploadUrlResponse"
    );

    if (uploadResponse.upload) {
      const uploadErrors = validateObjectShape(
        uploadResponse.upload,
        {
          uploadUrl: "string",
          uploadId: "string",
        },
        "AudioUploadUrlResponse.upload"
      );
      errors.push(...uploadErrors);
    }

    results.push({
      endpoint: "/media/transcode/audio/uploadUrl",
      method: "GET (media.getAudioUploadUrl)",
      success: errors.length === 0,
      errors,
      response: uploadResponse,
    });
  } catch (error) {
    results.push({
      endpoint: "/media/transcode/audio/uploadUrl",
      method: "GET (media.getAudioUploadUrl)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 7: media.getTranscodeStatus()
  console.log("7. Getting transcode status...");
  try {
    const uploadResponse = await yoto.media.getAudioUploadUrl();
    if (uploadResponse.upload?.uploadId) {
      const transcodeStatus = await yoto.media.getTranscodeStatus(
        uploadResponse.upload.uploadId
      );
      console.log(`   Got transcode status`);

      const errors = validateObjectShape(
        transcodeStatus,
        {
          transcode: "object",
        },
        "TranscodeResponse"
      );

      results.push({
        endpoint: `/media/upload/${uploadResponse.upload.uploadId}/transcoded`,
        method: "GET (media.getTranscodeStatus)",
        success: errors.length === 0,
        errors,
        response: transcodeStatus,
      });
    } else {
      results.push({
        endpoint: "/media/upload/{uploadId}/transcoded",
        method: "GET (media.getTranscodeStatus)",
        success: true,
        errors: ["SKIPPED - No upload ID available"],
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/media/upload/{uploadId}/transcoded",
      method: "GET (media.getTranscodeStatus)",
      success: false,
      errors: [String(error)],
    });
  }
}

async function main() {
  const accessToken = process.env.YOTO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Error: YOTO_ACCESS_TOKEN environment variable is required");
    console.error("Usage: YOTO_ACCESS_TOKEN=your_token bun run test/e2e/read-only-validations.ts");
    process.exit(1);
  }

  const yoto = new Yoto({ accessToken });

  await runValidations(yoto);
  printResults(results, "Read-Only Validations");

  process.exit(results.filter((r) => !r.success).length > 0 ? 1 : 0);
}

main();
