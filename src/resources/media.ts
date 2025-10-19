import type {
  AudioUploadUrlResponse,
  CoverImageUploadOptions,
  CoverImageUploadResponse,
  TranscodeResponse,
  TranscodeStatusOptions,
} from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class MediaResource extends YotoResource {
  /**
   * Get a presigned URL for uploading audio files
   * @returns Upload URL and upload ID for transcoding
   */
  async getAudioUploadUrl(): Promise<AudioUploadUrlResponse> {
    return this.get<AudioUploadUrlResponse>("/media/transcode/audio/uploadUrl");
  }

  /**
   * Get transcode status for an uploaded audio file
   * @param uploadId - The upload ID from getAudioUploadUrl
   * @param options - Transcode options
   * @returns Transcode status with SHA256 hash when complete
   */
  async getTranscodeStatus(
    uploadId: string,
    options: TranscodeStatusOptions = {},
  ): Promise<TranscodeResponse> {
    const { loudnorm = false } = options;

    return this.get<TranscodeResponse>(`/media/upload/${uploadId}/transcoded`, {
      loudnorm,
    });
  }

  /**
   * Upload a cover image
   * @param imageBlob - Image file data
   * @param options - Upload options
   * @returns Upload response with media ID and URL
   */
  async uploadCoverImage(
    imageBlob: Buffer | Blob,
    options: CoverImageUploadOptions = {},
  ): Promise<CoverImageUploadResponse> {
    const { autoconvert = true, coverType = "default" } = options;

    return this.client.request<CoverImageUploadResponse>(
      "/media/coverImage/user/me/upload",
      {
        method: "POST",
        query: {
          autoconvert,
          coverType,
        },
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: imageBlob,
      },
    );
  }
}
