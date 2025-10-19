/**
 * Content Resource Lifecycle Validation
 * 
 * Tests the full CRUD lifecycle of content resources:
 * - Empty state check
 * - Create (with media upload)
 * - Retrieve
 * - Update
 * - List
 * - Delete
 * 
 * Run with: bun run test/e2e/content-lifecycle.ts
 * Required: YOTO_ACCESS_TOKEN environment variable
 */

import { Yoto } from "../../src/index.ts";
import type { ValidationResult } from "./validation-utils.ts";
import {
  generateTestImage,
  generateTestMp3,
  printResults,
  validateObjectShape,
} from "./validation-utils.ts";

const results: ValidationResult[] = [];
const createdResources: {
  contentIds: string[];
} = {
  contentIds: [],
};

async function runLifecycleTests(yoto: Yoto): Promise<void> {
  console.log("Starting Content Lifecycle Validation...\n");

  // Test 1: Empty state - list MYO content
  console.log("1. Testing empty state (list MYO content)...");
  try {
    const myoContent = await yoto.content.listMYO();
    const errors: string[] = [];
    
    if (!Array.isArray(myoContent)) {
      errors.push("Response should be an array");
    } else {
      console.log(`   Found ${myoContent.length} existing content items`);
    }

    results.push({
      endpoint: "/content/mine",
      method: "GET (content.listMYO) - Empty State",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/content/mine",
      method: "GET (content.listMYO) - Empty State",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 2: Upload media files
  console.log("2. Uploading test media files...");
  let audioHash: string | undefined;
  let coverImageUrl: string | undefined;
  const mp3Buffer = generateTestMp3();

  try {
    const audioUploadUrl = await yoto.media.getAudioUploadUrl();
    
    const uploadResponse = await fetch(audioUploadUrl.upload.uploadUrl, {
      method: "PUT",
      body: mp3Buffer,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload MP3: ${uploadResponse.statusText}`);
    }
    
    console.log("   Waiting for audio transcoding...");
    let attempts = 0;
    while (attempts < 30) {
      const transcodeStatus = await yoto.media.getTranscodeStatus(
        audioUploadUrl.upload.uploadId
      );
      
      if (transcodeStatus.transcode.transcodedSha256) {
        audioHash = transcodeStatus.transcode.transcodedSha256;
        console.log(`   Audio transcoded: ${audioHash}`);
        break;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
    
    if (!audioHash) {
      throw new Error("Audio transcoding timed out");
    }

    results.push({
      endpoint: "/media/transcode/audio/uploadUrl",
      method: "Audio Upload & Transcode",
      success: true,
      errors: [],
    });
  } catch (error) {
    results.push({
      endpoint: "/media/transcode/audio/uploadUrl",
      method: "Audio Upload & Transcode",
      success: false,
      errors: [String(error)],
    });
  }

  try {
    const imageBuffer = generateTestImage();
    
    const uploadResponse = await yoto.media.uploadCoverImage(imageBuffer, {
      autoconvert: true,
      coverType: "default",
    });

    if (uploadResponse.coverImage?.mediaUrl) {
      coverImageUrl = uploadResponse.coverImage.mediaUrl;
      console.log(`   Cover image uploaded: ${coverImageUrl}`);
    }

    results.push({
      endpoint: "/media/coverImage/user/me/upload",
      method: "POST (media.uploadCoverImage)",
      success: true,
      errors: [],
    });
  } catch (error) {
    results.push({
      endpoint: "/media/coverImage/user/me/upload",
      method: "POST (media.uploadCoverImage)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 3: Create content
  console.log("3. Creating content...");
  try {
    if (!audioHash) {
      throw new Error("Cannot create content without valid audio");
    }

    const createRequest = {
      title: "Test Content - Lifecycle Script",
      content: {
        chapters: [
          {
            key: "chapter1",
            title: "Test Chapter",
            overlayLabel: "1",
            tracks: [
              {
                key: "track1",
                title: "Test Track",
                trackUrl: `yoto:#${audioHash}`,
                overlayLabel: "01",
                duration: 60,
                fileSize: mp3Buffer.length,
                channels: "stereo" as const,
                format: "mp3",
                type: "audio" as const,
              },
            ],
            display: {
              icon16x16: null,
            },
          },
        ],
        playbackType: "linear" as const,
      },
      metadata: {
        description: "Test content created by lifecycle validation script",
        ...(coverImageUrl ? {
          cover: {
            imageL: coverImageUrl,
          }
        } : {}),
      },
    };

    const createdContent = await yoto.content.create(createRequest);
    createdResources.contentIds.push(createdContent.cardId);
    console.log(`   Created content: ${createdContent.cardId}`);

    const errors = validateObjectShape(
      createdContent,
      {
        cardId: "string",
        title: "string",
        content: "object",
        metadata: "object",
        userId: { optional: true, type: "string" },
        createdAt: { optional: true, type: "string" },
        updatedAt: { optional: true, type: "string" },
      },
      "Content"
    );

    results.push({
      endpoint: "/content",
      method: "POST (content.create)",
      success: errors.length === 0,
      errors,
      response: createdContent,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      endpoint: "/content",
      method: "POST (content.create)",
      success: false,
      errors: [errorMessage],
    });
  }

  // Test 4: Retrieve content
  console.log("4. Retrieving content...");
  try {
    if (createdResources.contentIds.length === 0) {
      throw new Error("No content created to retrieve");
    }

    const cardId = createdResources.contentIds[0]!;
    const retrievedContent = await yoto.content.retrieve(cardId);
    console.log(`   Retrieved content: ${retrievedContent.cardId}`);

    const errors = validateObjectShape(
      retrievedContent,
      {
        cardId: "string",
        title: "string",
        content: "object",
        metadata: "object",
      },
      "Content"
    );

    // Validate that retrieved content matches created content
    if (retrievedContent.cardId !== cardId) {
      errors.push(`Retrieved content ID mismatch: expected ${cardId}, got ${retrievedContent.cardId}`);
    }

    results.push({
      endpoint: `/content/${cardId}`,
      method: "GET (content.retrieve)",
      success: errors.length === 0,
      errors,
      response: retrievedContent,
    });
  } catch (error) {
    results.push({
      endpoint: "/content/{cardId}",
      method: "GET (content.retrieve)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 5: Update content
  console.log("5. Updating content...");
  try {
    if (createdResources.contentIds.length === 0) {
      throw new Error("No content created to update");
    }

    const cardId = createdResources.contentIds[0]!;
    const updateRequest = {
      title: "Updated Test Content - Lifecycle Script",
      metadata: {
        description: "Updated description",
      },
    };

    const updatedContent = await yoto.content.update(cardId, updateRequest);
    console.log(`   Updated content: ${updatedContent.cardId}`);

    const errors = validateObjectShape(
      updatedContent,
      {
        cardId: "string",
        title: "string",
        content: "object",
        metadata: "object",
      },
      "Content"
    );

    // Validate that title was updated
    if (updatedContent.title !== updateRequest.title) {
      errors.push(`Title not updated: expected "${updateRequest.title}", got "${updatedContent.title}"`);
    }

    results.push({
      endpoint: `/content/${cardId}`,
      method: "POST (content.update)",
      success: errors.length === 0,
      errors,
      response: updatedContent,
    });
  } catch (error) {
    results.push({
      endpoint: "/content",
      method: "POST (content.update)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 6: List content to verify update
  console.log("6. Listing content to verify update...");
  try {
    // Wait briefly for update to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const myoContent = await yoto.content.listMYO();
    const ourContent = myoContent.find(
      c => createdResources.contentIds.includes(c.cardId)
    );

    const errors: string[] = [];
    if (!ourContent) {
      errors.push("Created content not found in list");
    } else if (ourContent.title !== "Updated Test Content - Lifecycle Script") {
      errors.push(`Title not updated in list: got "${ourContent.title}"`);
    }

    results.push({
      endpoint: "/content/mine",
      method: "GET (content.listMYO) - Verify Update",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/content/mine",
      method: "GET (content.listMYO) - Verify Update",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 7: Delete content
  console.log("7. Deleting content...");
  try {
    if (createdResources.contentIds.length === 0) {
      throw new Error("No content created to delete");
    }

    const cardId = createdResources.contentIds[0]!;
    await yoto.content.remove(cardId);
    console.log(`   Deleted content: ${cardId}`);

    results.push({
      endpoint: `/content/${cardId}`,
      method: "DELETE (content.remove)",
      success: true,
      errors: [],
    });
  } catch (error) {
    results.push({
      endpoint: "/content/{cardId}",
      method: "DELETE (content.remove)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 8: Verify deletion
  console.log("8. Verifying deletion...");
  try {
    if (createdResources.contentIds.length === 0) {
      throw new Error("No content to verify deletion");
    }
    const cardId = createdResources.contentIds[0]!;
    
    try {
      const content = await yoto.content.retrieve(cardId);
      // Check if the content is marked as deleted
      if (content.deleted === true) {
        console.log(`   Content marked as deleted: ${JSON.stringify(content, null, 2)}`);
        results.push({
          endpoint: `/content/${cardId}`,
          method: "GET (content.retrieve) - Verify Deletion",
          success: true,
          errors: [],
        });
      } else {
        console.log(`   Content still exists and not deleted: ${JSON.stringify(content, null, 2)}`);
        results.push({
          endpoint: `/content/${cardId}`,
          method: "GET (content.retrieve) - Verify Deletion",
          success: false,
          errors: ["Content exists but deleted flag is not true"],
        });
      }
    } catch (error) {
      // Unexpected error during verification
      const errorStr = String(error);
      if (errorStr.includes("404") || errorStr.includes("Not Found") || errorStr.includes("not found")) {
        results.push({
          endpoint: `/content/${cardId}`,
          method: "GET (content.retrieve) - Verify Deletion",
          success: false,
          errors: [`Unexpected error: ${errorStr}`],
        });
      }
    }
    
    // Clear from tracking since it's deleted
    createdResources.contentIds = [];
  } catch (error) {
    results.push({
      endpoint: "/content/{cardId}",
      method: "GET (content.retrieve) - Verify Deletion",
      success: false,
      errors: [String(error)],
    });
  }
}

async function cleanup(yoto: Yoto): Promise<void> {
  if (createdResources.contentIds.length === 0) {
    return;
  }

  console.log("\nCleaning up remaining test resources...");
  
  for (const cardId of createdResources.contentIds) {
    try {
      await yoto.content.remove(cardId);
      console.log(`  ✓ Deleted content: ${cardId}`);
    } catch (error) {
      console.log(`  ✗ Failed to delete content ${cardId}: ${error}`);
    }
  }
}

async function main() {
  const accessToken = process.env.YOTO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Error: YOTO_ACCESS_TOKEN environment variable is required");
    console.error("Usage: YOTO_ACCESS_TOKEN=your_token bun run test/e2e/content-lifecycle.ts");
    process.exit(1);
  }

  const yoto = new Yoto({ accessToken });

  try {
    await runLifecycleTests(yoto);
    printResults(results, "Content Lifecycle");
  } finally {
    await cleanup(yoto);
  }

  process.exit(results.filter((r) => !r.success).length > 0 ? 1 : 0);
}

main();


