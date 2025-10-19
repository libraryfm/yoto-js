import type { FamilyImage, UploadImageResponse } from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class FamilyResource extends YotoResource {
  /**
   * Get a family image by ID
   * Note: This fetches from the list and finds the matching image
   * @param imageId - The image ID
   * @returns The family image
   */
  async getImage(imageId: string): Promise<FamilyImage> {
    const images = await this.listImages();
    const image = images.find((img) => img.imageId === imageId);

    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }

    return image;
  }

  /**
   * List all family images
   * @returns Array of family images
   */
  async listImages(): Promise<FamilyImage[]> {
    const response = await this.get<{ images: FamilyImage[] }>(
      "/media/family/images",
    );
    return response.images;
  }

  /**
   * Upload a family image
   * @param file - Image file data
   * @returns Upload response with image ID and URL
   */
  async uploadImage(file: Buffer | Blob): Promise<UploadImageResponse> {
    return this.client.request<UploadImageResponse>("/media/family/images", {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: file,
    });
  }
}
