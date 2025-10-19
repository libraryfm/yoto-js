import type { ListIconsResponse, UploadIconResponse } from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class IconsResource extends YotoResource {
  /**
   * List public icons
   * @returns List of public icons
   */
  async listPublic(): Promise<ListIconsResponse> {
    return this.get<ListIconsResponse>("/media/displayIcons/user/yoto");
  }

  /**
   * List user's custom icons
   * @returns List of user icons
   */
  async listUser(): Promise<ListIconsResponse> {
    return this.get<ListIconsResponse>("/media/displayIcons/user/me");
  }

  /**
   * Upload a custom icon
   * @param file - Icon file data
   * @param name - Icon name
   * @returns Upload response with icon ID and URL
   */
  async upload(file: Buffer | Blob, name: string): Promise<UploadIconResponse> {
    return this.post<UploadIconResponse>("/icons", {
      file,
      name,
    });
  }
}
