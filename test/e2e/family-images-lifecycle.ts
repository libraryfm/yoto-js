/**
 * Family Images Lifecycle Validation
 * 
 * Tests family image operations (no delete/update available in API):
 * - Empty state check
 * - Upload image
 * - Retrieve image
 * - List images
 * 
 * Run with: bun run test/e2e/family-images-lifecycle.ts
 * Required: YOTO_ACCESS_TOKEN environment variable
 */

import { Yoto } from "../../src/index.ts";
import type { ValidationResult } from "../e2e/validation-utils.ts";
import {
  generateTestImage,
  printResults,
  validateObjectShape,
} from "./validation-utils.ts";

const results: ValidationResult[] = [];
let uploadedImageId: string | undefined;

async function runLifecycleTests(yoto: Yoto): Promise<void> {
  console.log("Starting Family Images Lifecycle Validation...\n");

  // Test 1: Empty state - list images
  console.log("1. Testing empty state (list images)...");
  try {
    const images = await yoto.family.listImages();
    const errors: string[] = [];
    
    if (!Array.isArray(images)) {
      errors.push("Response should be an array");
    } else {
      console.log(`   Found ${images.length} existing images`);
    }

    results.push({
      endpoint: "/family/images",
      method: "GET (family.listImages) - Empty State",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/family/images",
      method: "GET (family.listImages) - Empty State",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 2: Upload image
  console.log("2. Uploading image...");
  try {
    const imageBuffer = generateTestImage();
    
    const uploadResponse = await yoto.family.uploadImage(
      imageBuffer
    );
    
    uploadedImageId = uploadResponse.imageId;
    console.log(`   Uploaded image: ${uploadedImageId}`);

    const errors = validateObjectShape(
      uploadResponse,
      {
        imageId: "string",
        url: "string",
      },
      "UploadImageResponse"
    );

    results.push({
      endpoint: "/family/images",
      method: "POST (family.uploadImage)",
      success: errors.length === 0,
      errors,
      response: uploadResponse,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      endpoint: "/family/images",
      method: "POST (family.uploadImage)",
      success: false,
      errors: [errorMessage],
    });
  }

  // Test 3: Retrieve image
  console.log("3. Retrieving image...");
  try {
    if (!uploadedImageId) {
      throw new Error("No image uploaded to retrieve");
    }

    const retrievedImage = await yoto.family.getImage(uploadedImageId);
    console.log(`   Retrieved image: ${retrievedImage.imageId}`);

    const errors = validateObjectShape(
      retrievedImage,
      {
        imageId: "string",
        lastModified: "string",
        eTag: "string",
        size: "number",
      },
      "FamilyImage"
    );

    if (retrievedImage.imageId !== uploadedImageId) {
      errors.push(`Retrieved image ID mismatch: expected ${uploadedImageId}, got ${retrievedImage.imageId}`);
    }

    results.push({
      endpoint: `/family/images/${uploadedImageId}`,
      method: "GET (family.getImage)",
      success: errors.length === 0,
      errors,
      response: retrievedImage,
    });
  } catch (error) {
    results.push({
      endpoint: "/family/images/{imageId}",
      method: "GET (family.getImage)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 4: List images to verify upload
  console.log("4. Listing images to verify upload...");
  try {
    const images = await yoto.family.listImages();
    console.log(`   Found ${images.length} images`);
    const ourImage = images.find(img => img.imageId === uploadedImageId);

    const errors: string[] = [];
    if (!ourImage) {
      errors.push("Uploaded image not found in list");
    }

    results.push({
      endpoint: "/family/images",
      method: "GET (family.listImages) - Verify Upload",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/family/images",
      method: "GET (family.listImages) - Verify Upload",
      success: false,
      errors: [String(error)],
    });
  }
}

async function main() {
  const accessToken = process.env.YOTO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Error: YOTO_ACCESS_TOKEN environment variable is required");
    console.error("Usage: YOTO_ACCESS_TOKEN=your_token bun run test/e2e/family-images-lifecycle.ts");
    process.exit(1);
  }

  const yoto = new Yoto({ accessToken });

  try {
    await runLifecycleTests(yoto);
    printResults(results, "Family Images Lifecycle");
    
    if (uploadedImageId) {
      console.log("\nNote: Uploaded image cannot be deleted via API");
      console.log(`Image ID: ${uploadedImageId}`);
    }
  } finally {
    // No cleanup possible - family images cannot be deleted via API
  }

  process.exit(results.filter((r) => !r.success).length > 0 ? 1 : 0);
}

main();

