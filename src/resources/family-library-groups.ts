import type {
  CreateGroupRequest,
  FamilyLibraryGroup,
  UpdateGroupRequest,
} from "../types";
import { YotoResource } from "../yoto-resource.ts";

export class FamilyLibraryGroupsResource extends YotoResource {
  /**
   * List all family library groups
   * @returns List of groups
   */
  async list(): Promise<FamilyLibraryGroup[]> {
    return this.get<FamilyLibraryGroup[]>("/card/family/library/groups");
  }

  /**
   * Create a new group
   * @param data - Group creation data
   * @returns The created group
   */
  async create(data: CreateGroupRequest): Promise<FamilyLibraryGroup> {
    return this.post<FamilyLibraryGroup>("/card/family/library/groups", data);
  }

  /**
   * Get a group by ID
   * @param groupId - The group ID
   * @returns The group
   */
  async retrieve(groupId: string): Promise<FamilyLibraryGroup> {
    return this.get<FamilyLibraryGroup>(
      `/card/family/library/groups/${groupId}`,
    );
  }

  /**
   * Update a group
   * @param groupId - The group ID
   * @param data - Group update data
   * @returns The updated group
   */
  async update(
    groupId: string,
    data: UpdateGroupRequest,
  ): Promise<FamilyLibraryGroup> {
    return this.put<FamilyLibraryGroup>(
      `/card/family/library/groups/${groupId}`,
      data,
    );
  }

  /**
   * Delete a group
   * @param groupId - The group ID
   */
  async remove(groupId: string): Promise<void> {
    await this.delete<void>(`/card/family/library/groups/${groupId}`);
  }
}
