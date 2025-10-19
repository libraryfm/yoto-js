/**
 * Family Library Groups Lifecycle Validation
 * 
 * Tests the full CRUD lifecycle of family library group resources:
 * - Empty state check
 * - Create (with test content)
 * - Retrieve
 * - Update
 * - List
 * - Delete
 * 
 * Run with: bun run test/e2e/family-library-groups-lifecycle.ts
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
  groupIds: string[];
} = {
  contentIds: [],
  groupIds: [],
};

async function runLifecycleTests(yoto: Yoto): Promise<void> {
  console.log("Starting Family Library Groups Lifecycle Validation...\n");

  // Test 1: Empty state - list groups
  console.log("1. Testing empty state (list groups)...");
  try {
    const groups = await yoto.familyLibraryGroups.list();
    const errors: string[] = [];
    
    if (!Array.isArray(groups)) {
      errors.push("Response should be an array");
    } else {
      console.log(`   Found ${groups.length} existing groups`);
    }

    results.push({
      endpoint: "/card/family/library/groups",
      method: "GET (familyLibraryGroups.list) - Empty State",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups",
      method: "GET (familyLibraryGroups.list) - Empty State",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 2: Create test content (needed for group items)
  console.log("2. Creating test content for group...");
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
  } catch (error) {
    console.log(`   Audio upload failed: ${error}`);
  }

  try {
    const imageBuffer = generateTestImage();
    
    const uploadResponse = await yoto.media.uploadCoverImage(imageBuffer, {
      autoconvert: true,
      coverType: "default",
    });

    if (uploadResponse.coverImage?.mediaUrl) {
      coverImageUrl = uploadResponse.coverImage.mediaUrl;
      console.log(`   Cover image uploaded`);
    }
  } catch (error) {
    console.log(`   Image upload failed: ${error}`);
  }

  try {
    if (!audioHash) {
      throw new Error("Cannot create content without valid audio");
    }

    const createRequest = {
      title: "Test Content for Group - Lifecycle Script",
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
        description: "Test content for group validation",
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
  } catch (error) {
    console.log(`   Content creation failed: ${error}`);
  }

  // Test 3: Create group
  console.log("3. Creating group...");
  try {
    const createGroupRequest = {
      name: "Test Group - Lifecycle Script",
      imageId: "fp-cards",
      items: createdResources.contentIds.length > 0 
        ? createdResources.contentIds.map(id => ({ contentId: id }))
        : [],
    };

    const createdGroup = await yoto.familyLibraryGroups.create(createGroupRequest);
    createdResources.groupIds.push(createdGroup.id);
    console.log(`   Created group: ${createdGroup.id}`);

    const errors = validateObjectShape(
      createdGroup,
      {
        id: "string",
        familyId: "string",
        name: "string",
        imageId: { optional: true, type: "string" },
        imageUrl: { optional: true, type: "string" },
        items: "array",
        cards: { optional: true, type: "array" },
        createdAt: "string",
        lastModifiedAt: "string",
      },
      "FamilyLibraryGroup"
    );

    results.push({
      endpoint: "/card/family/library/groups",
      method: "POST (familyLibraryGroups.create)",
      success: errors.length === 0,
      errors,
      response: createdGroup,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      endpoint: "/card/family/library/groups",
      method: "POST (familyLibraryGroups.create)",
      success: false,
      errors: [errorMessage],
    });
  }

  // Test 4: Retrieve group
  console.log("4. Retrieving group...");
  try {
    if (createdResources.groupIds.length === 0) {
      throw new Error("No group created to retrieve");
    }

    const groupId = createdResources.groupIds[0]!;
    const retrievedGroup = await yoto.familyLibraryGroups.retrieve(groupId);
    console.log(`   Retrieved group: ${retrievedGroup.id}`);

    const errors = validateObjectShape(
      retrievedGroup,
      {
        id: "string",
        familyId: "string",
        name: "string",
        imageId: { optional: true, type: "string" },
        imageUrl: { optional: true, type: "string" },
        items: "array",
        cards: { optional: true, type: "array" },
        createdAt: "string",
        lastModifiedAt: "string",
      },
      "FamilyLibraryGroup"
    );

    if (retrievedGroup.id !== groupId) {
      errors.push(`Retrieved group ID mismatch: expected ${groupId}, got ${retrievedGroup.id}`);
    }

    results.push({
      endpoint: `/card/family/library/groups/${groupId}`,
      method: "GET (familyLibraryGroups.retrieve)",
      success: errors.length === 0,
      errors,
      response: retrievedGroup,
    });
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups/{groupId}",
      method: "GET (familyLibraryGroups.retrieve)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 5: Update group
  console.log("5. Updating group...");
  try {
    if (createdResources.groupIds.length === 0) {
      throw new Error("No group created to update");
    }

    const groupId = createdResources.groupIds[0]!;
    const currentGroup = await yoto.familyLibraryGroups.retrieve(groupId);
    const updateRequest = {
      name: "Updated Test Group - Lifecycle Script",
      imageId: currentGroup.imageId || "fp-cards",
      items: currentGroup.items.map(item => ({ contentId: item.contentId })),
    };

    const updatedGroup = await yoto.familyLibraryGroups.update(groupId, updateRequest);
    console.log(`   Updated group: ${updatedGroup.id}`);

    const errors = validateObjectShape(
      updatedGroup,
      {
        id: "string",
        familyId: "string",
        name: "string",
        imageId: { optional: true, type: "string" },
        imageUrl: { optional: true, type: "string" },
        items: "array",
        cards: { optional: true, type: "array" },
        createdAt: "string",
        lastModifiedAt: "string",
      },
      "FamilyLibraryGroup"
    );

    if (updatedGroup.name !== updateRequest.name) {
      errors.push(`Name not updated: expected "${updateRequest.name}", got "${updatedGroup.name}"`);
    }

    results.push({
      endpoint: `/card/family/library/groups/${groupId}`,
      method: "PUT (familyLibraryGroups.update)",
      success: errors.length === 0,
      errors,
      response: updatedGroup,
    });
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups/{groupId}",
      method: "PUT (familyLibraryGroups.update)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 6: List groups to verify update
  console.log("6. Listing groups to verify update...");
  try {
    const groups = await yoto.familyLibraryGroups.list();
    const ourGroup = groups.find(
      g => createdResources.groupIds.includes(g.id)
    );

    const errors: string[] = [];
    if (!ourGroup) {
      errors.push("Created group not found in list");
    } else if (ourGroup.name !== "Updated Test Group - Lifecycle Script") {
      errors.push(`Name not updated in list: got "${ourGroup.name}"`);
    }

    results.push({
      endpoint: "/card/family/library/groups",
      method: "GET (familyLibraryGroups.list) - Verify Update",
      success: errors.length === 0,
      errors,
    });
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups",
      method: "GET (familyLibraryGroups.list) - Verify Update",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 7: Delete group
  console.log("7. Deleting group...");
  try {
    if (createdResources.groupIds.length === 0) {
      throw new Error("No group created to delete");
    }

    const groupId = createdResources.groupIds[0]!;
    await yoto.familyLibraryGroups.remove(groupId);
    console.log(`   Deleted group: ${groupId}`);

    results.push({
      endpoint: `/card/family/library/groups/${groupId}`,
      method: "DELETE (familyLibraryGroups.remove)",
      success: true,
      errors: [],
    });
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups/{groupId}",
      method: "DELETE (familyLibraryGroups.remove)",
      success: false,
      errors: [String(error)],
    });
  }

  // Test 8: Verify deletion
  console.log("8. Verifying deletion...");
  try {
    if (createdResources.groupIds.length === 0) {
      throw new Error("No group to verify deletion");
    }

    const groupId = createdResources.groupIds[0]!;
    
    try {
      await yoto.familyLibraryGroups.retrieve(groupId);
      results.push({
        endpoint: `/card/family/library/groups/${groupId}`,
        method: "GET (familyLibraryGroups.retrieve) - Verify Deletion",
        success: false,
        errors: ["Group still exists after deletion"],
      });
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes("404") || errorStr.includes("Not Found") || errorStr.includes("not found")) {
        results.push({
          endpoint: `/card/family/library/groups/${groupId}`,
          method: "GET (familyLibraryGroups.retrieve) - Verify Deletion",
          success: true,
          errors: [],
        });
      } else {
        results.push({
          endpoint: `/card/family/library/groups/${groupId}`,
          method: "GET (familyLibraryGroups.retrieve) - Verify Deletion",
          success: false,
          errors: [`Unexpected error: ${errorStr}`],
        });
      }
    }
    
    createdResources.groupIds = [];
  } catch (error) {
    results.push({
      endpoint: "/card/family/library/groups/{groupId}",
      method: "GET (familyLibraryGroups.retrieve) - Verify Deletion",
      success: false,
      errors: [String(error)],
    });
  }
}

async function cleanup(yoto: Yoto): Promise<void> {
  console.log("\nCleaning up test resources...");
  
  for (const groupId of createdResources.groupIds) {
    try {
      await yoto.familyLibraryGroups.remove(groupId);
      console.log(`  ✓ Deleted group: ${groupId}`);
    } catch (error) {
      console.log(`  ✗ Failed to delete group ${groupId}: ${error}`);
    }
  }

  for (const contentId of createdResources.contentIds) {
    try {
      await yoto.content.remove(contentId);
      console.log(`  ✓ Deleted content: ${contentId}`);
    } catch (error) {
      console.log(`  ✗ Failed to delete content ${contentId}: ${error}`);
    }
  }
}

async function main() {
  const accessToken = process.env.YOTO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Error: YOTO_ACCESS_TOKEN environment variable is required");
    console.error("Usage: YOTO_ACCESS_TOKEN=your_token bun run test/e2e/family-library-groups-lifecycle.ts");
    process.exit(1);
  }

  const yoto = new Yoto({ accessToken });

  try {
    await runLifecycleTests(yoto);
    printResults(results, "Family Library Groups Lifecycle");
  } finally {
    await cleanup(yoto);
  }

  process.exit(results.filter((r) => !r.success).length > 0 ? 1 : 0);
}

main();


