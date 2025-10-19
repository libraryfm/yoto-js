// Audio upload URL request/response
export interface AudioUploadUrlResponse {
  upload: {
    uploadUrl: string;
    uploadId: string;
  };
}

// Transcoded audio info
export interface TranscodedInfo {
  duration?: number;
  fileSize?: number;
  channels?: number;
  format?: string;
  metadata?: {
    title?: string;
    [key: string]: unknown;
  };
}

// Transcode status response
export interface TranscodeResponse {
  transcode: {
    transcodedSha256?: string;
    transcodedInfo?: TranscodedInfo;
  };
}

// Transcode status options
export interface TranscodeStatusOptions {
  loudnorm?: boolean;
}

// Cover image upload options
export interface CoverImageUploadOptions {
  autoconvert?: boolean;
  coverType?: string;
}

// Cover image upload response
export interface CoverImageUploadResponse {
  coverImage: {
    mediaId: string;
    mediaUrl: string;
  };
}
