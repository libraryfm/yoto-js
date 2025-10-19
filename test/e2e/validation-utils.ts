/**
 * Shared Validation Utilities
 * 
 * Common functions and types used across lifecycle validation scripts.
 */

export interface ValidationResult {
  endpoint: string;
  method: string;
  success: boolean;
  errors: string[];
  response?: unknown;
}

/**
 * Validates object structure against expected type
 */
export function validateObjectShape(
  obj: unknown,
  expectedFields: Record<string, string | { optional: boolean; type: string }>,
  path = ""
): string[] {
  const errors: string[] = [];

  if (typeof obj !== "object" || obj === null) {
    errors.push(`${path} is not an object`);
    return errors;
  }

  const record = obj as Record<string, unknown>;

  // Check required fields
  for (const [field, typeInfo] of Object.entries(expectedFields)) {
    const fullPath = path ? `${path}.${field}` : field;
    const isOptional = typeof typeInfo === "object" && typeInfo.optional;
    const expectedType = typeof typeInfo === "string" ? typeInfo : typeInfo.type;

    if (!(field in record)) {
      if (!isOptional) {
        errors.push(`Missing required field: ${fullPath}`);
      }
      continue;
    }

    const value = record[field];

    // Basic type checking
    if (expectedType === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${fullPath} should be an array, got ${typeof value}`);
      }
    } else if (expectedType === "object") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${fullPath} should be an object, got ${typeof value}`);
      }
    } else if (expectedType !== "any") {
      const actualType = typeof value;
      if (actualType !== expectedType && value !== null) {
        errors.push(
          `${fullPath} should be ${expectedType}, got ${actualType}`
        );
      }
    }
  }

  return errors;
}

/**
 * Generate minimal valid MP3 file (silent 1-second audio)
 */
export function generateTestMp3(): Buffer {
  // Minimal MP3: MPEG Audio Layer III, ~1 second of silence
  const frames: number[] = [];
  
  // MP3 frame header for MPEG-1 Layer III, 128kbps, 44.1kHz, mono
  const header = [0xff, 0xfb, 0x90, 0x00];
  
  // Create 38 frames for ~1 second at 44.1kHz
  for (let i = 0; i < 38; i++) {
    frames.push(...header);
    // Add padding to make each frame 417 bytes (128kbps frame size)
    for (let j = 0; j < 413; j++) {
      frames.push(0x00);
    }
  }
  
  return Buffer.from(frames);
}

/**
 * Generate minimal valid JPEG file (200x200 solid color)
 */
export function generateTestImage(): Buffer {
  // Minimal valid JPEG: small red square
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, // JFIF header
    0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03,
    0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
    0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06,
    0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09,
    0x08, 0x09, 0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a,
    0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d,
    0x0e, 0x0f, 0x10, 0x10, 0x11, 0x10, 0x0a, 0x0c,
    0x12, 0x13, 0x12, 0x10, 0x13, 0x0f, 0x10, 0x10,
    0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
    0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x09, 0xff, 0xc4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3f, 0x00, 0x7f, 0xa0, 0xff, 0xd9,
  ]);
  return jpeg;
}

/**
 * Generate minimal valid PNG file (16x16 solid red pixel)
 */
export function generateTestIcon(): Buffer {
  // Minimal PNG: 16x16 red square
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68,
    0x36, 0x00, 0x00, 0x00, 0x3a, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9c, 0xed, 0xc1, 0x01, 0x0d, 0x00,
    0x00, 0x00, 0xc2, 0xa0, 0xf7, 0x4f, 0x6d, 0x0e,
    0x37, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x80, 0x77, 0x03, 0x71, 0x00, 0x01, 0xa7, 0x4c,
    0x65, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return png;
}

/**
 * Print validation results
 */
export function printResults(results: ValidationResult[], scriptName: string): void {
  console.log(`\n=== ${scriptName} Results ===\n`);

  const passed = results.filter(
    (r) => r.success && !r.errors.some((e) => e.startsWith("SKIPPED"))
  );
  const skipped = results.filter(
    (r) => r.success && r.errors.some((e) => e.startsWith("SKIPPED"))
  );
  const failed = results.filter((r) => !r.success);

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n--- Failed Tests ---\n");
    for (const result of failed) {
      console.log(`❌ ${result.method}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      for (const error of result.errors) {
        console.log(`   Error: ${error}`);
      }
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
      console.log("");
    }
  }

  if (skipped.length > 0) {
    console.log("\n--- Skipped Tests ---\n");
    for (const result of skipped) {
      console.log(`⊝ ${result.method}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      console.log(`   Reason: ${result.errors[0]}`);
    }
  }

  if (passed.length > 0) {
    console.log("\n--- Passed Tests ---\n");
    for (const result of passed) {
      console.log(`✅ ${result.method}`);
      console.log(`   Endpoint: ${result.endpoint}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(
    `Overall: ${failed.length === 0 ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`
  );
}

