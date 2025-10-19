import { beforeEach, describe, expect, mock, test } from "bun:test";
import { MediaResource } from "../src/resources/media.ts";
import type { HttpClient } from "../src/http-client.ts";

describe("MediaResource", () => {
  let media: MediaResource;
  let mockClient: HttpClient;

  beforeEach(() => {
    mockClient = {
      request: mock(() => Promise.resolve({})),
    } as unknown as HttpClient;
    media = new MediaResource(mockClient);
  });

  test("getAudioUploadUrl should return upload URL and ID", async () => {
    const mockResponse = {
      upload: {
        uploadUrl: "https://s3.example.com/upload",
        uploadId: "upload-123",
      },
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockResponse,
    );

    const result = await media.getAudioUploadUrl();

    expect(mockClient.request).toHaveBeenCalledWith(
      "/media/transcode/audio/uploadUrl",
      { method: "GET" },
    );
    expect(result).toEqual(mockResponse);
  });

  test("getTranscodeStatus should poll with uploadId", async () => {
    const mockResponse = {
      transcode: {
        transcodedSha256: "sha256hash",
        transcodedInfo: {},
      },
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockResponse,
    );

    const result = await media.getTranscodeStatus("upload-123");

    expect(mockClient.request).toHaveBeenCalledWith(
      "/media/upload/upload-123/transcoded",
      {
        method: "GET",
        query: { loudnorm: false },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test("getTranscodeStatus should pass loudnorm option", async () => {
    await media.getTranscodeStatus("upload-123", { loudnorm: true });

    expect(mockClient.request).toHaveBeenCalledWith(
      "/media/upload/upload-123/transcoded",
      {
        method: "GET",
        query: { loudnorm: true },
      },
    );
  });

  test("uploadCoverImage should post with default options", async () => {
    const blob = new Blob(["image data"]);
    const mockResponse = {
      coverImage: {
        mediaId: "img-123",
        mediaUrl: "https://example.com/img.jpg",
      },
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockResponse,
    );

    const result = await media.uploadCoverImage(blob);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/media/coverImage/user/me/upload",
      {
        method: "POST",
        query: {
          autoconvert: true,
          coverType: "default",
        },
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: blob,
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test("uploadCoverImage should accept custom options", async () => {
    const blob = new Blob(["image data"]);

    await media.uploadCoverImage(blob, {
      autoconvert: false,
      coverType: "custom",
    });

    expect(mockClient.request).toHaveBeenCalledWith(
      "/media/coverImage/user/me/upload",
      {
        method: "POST",
        query: {
          autoconvert: false,
          coverType: "custom",
        },
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: blob,
      },
    );
  });
});

