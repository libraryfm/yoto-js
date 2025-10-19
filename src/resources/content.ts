import type {
  Content,
  CreateContentRequest,
  UpdateContentRequest,
} from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class ContentResource extends YotoResource {
  /**
   * Get content by ID
   * @param cardId - The card ID
   * @returns The content object
   */
  async retrieve(cardId: string): Promise<Content> {
    const response = await this.get<{ card: Content }>(`/content/${cardId}`);
    return response.card;
  }

  /**
   * Create new content
   * @param data - Content creation data
   * @returns The created content
   */
  async create(data: CreateContentRequest): Promise<Content> {
    const response = await this.post<{ card: Content }>("/content", data);
    return response.card;
  }

  /**
   * Update existing content
   * @param cardId - The card ID
   * @param data - Content update data
   * @returns The updated content
   */
  async update(cardId: string, data: UpdateContentRequest): Promise<Content> {
    const response = await this.post<{ card: Content }>("/content", {
      ...data,
      cardId,
    });
    return response.card;
  }

  /**
   * Delete content
   * @param cardId - The card ID
   */
  async remove(cardId: string): Promise<void> {
    await this.delete<void>(`/content/${cardId}`);
  }

  /**
   * List user's MYO (Make Your Own) content
   * @returns List of MYO content
   */
  async listMYO(): Promise<Content[]> {
    const response = await this.get<{ cards: Content[] }>("/content/mine");
    return response.cards;
  }
}
