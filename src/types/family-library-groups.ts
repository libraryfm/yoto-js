import type { Content } from "./content";

export interface FamilyLibraryGroup {
  id: string;
  familyId: string;
  name: string;
  imageId?: string;
  imageUrl?: string;
  items: Array<{
    contentId: string;
    addedAt: string;
  }>;
  cards?: Content[];
  createdAt: string;
  lastModifiedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  imageId: string;
  items: Array<{ contentId: string }>;
  description?: string;
}

export interface UpdateGroupRequest {
  name: string;
  imageId: string;
  items: Array<{ contentId: string }>;
  description?: string;
}
