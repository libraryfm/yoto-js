// Track display configuration
export interface TrackDisplay {
  icon16x16: string | null;
}

// Track within a chapter
export interface Track {
  key: string;
  title: string;
  trackUrl: string;
  overlayLabel: string;
  duration?: number;
  fileSize?: number;
  channels?: "stereo" | "mono";
  format: string;
  type: "audio" | "stream";
  display?: TrackDisplay | null;
  uid?: string | null;
  overlayLabelOverride?: string | null;
  ambient?: null;
  transitions?: Record<string, unknown>;
}

// Chapter display configuration
export interface ChapterDisplay {
  icon16x16: string | null;
}

// Chapter containing tracks
export interface Chapter {
  key: string;
  title?: string;
  overlayLabel?: string;
  overlayLabelOverride?: string | null;
  tracks: Track[];
  defaultTrackDisplay?: string | null;
  defaultTrackAmbient?: string | null;
  duration?: number;
  fileSize?: number;
  display?: ChapterDisplay | Record<string, unknown>;
  ambient?: null;
  hasStreams?: boolean;
}

// Content metadata
export interface ContentMetadata {
  media?: {
    duration: number;
    fileSize: number;
    readableFileSize?: number;
    hasStreams?: boolean;
  };
  cover?: {
    imageL: string;
  };
  description?: string;
  author?: string;
  category?: string;
  status?: {
    name: string;
    updatedAt: string;
  };
}

// Content nested structure
export interface ContentData {
  chapters: Chapter[];
  playbackType?: "linear" | "random";
  activity?: string;
  config?: {
    onlineOnly?: boolean;
    resumeTimeout?: number;
  };
  editSettings?: {
    autoOverlayLabels?: string;
    editKeys?: boolean;
  };
  version?: string;
}

// Full content object returned by API
export interface Content {
  cardId: string;
  title: string;
  content: ContentData;
  metadata: ContentMetadata;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  availability?: string;
  slug?: string;
  sortkey?: string;
  deleted?: boolean;
}

// Request to create new content
export interface CreateContentRequest {
  title: string;
  content: ContentData;
  metadata?: ContentMetadata;
}

// Request to update existing content
export interface UpdateContentRequest {
  title?: string;
  content?: ContentData;
  metadata?: ContentMetadata;
}

// Response for listing MYO content
export interface ListMYOContentResponse {
  content: Content[];
}
