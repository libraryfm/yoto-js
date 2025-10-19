export interface DisplayIcon {
  mediaId: string;
  userId: string;
  createdAt: string;
  new?: boolean;
  publicTags?: string[];
  title?: string;
  url: string;
  public?: boolean;
  displayIconId: string;
}

export interface ListIconsResponse {
  displayIcons: DisplayIcon[];
}

export interface UploadIconResponse {
  id: string;
  url: string;
}
