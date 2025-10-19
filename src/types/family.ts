export interface FamilyImage {
  imageId: string;
  lastModified: string;
  eTag: string;
  size: number;
}

export interface UploadImageResponse {
  imageId: string;
  url: string;
}
