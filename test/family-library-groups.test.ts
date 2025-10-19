import { beforeEach, describe, expect, mock, test } from "bun:test";
import { FamilyLibraryGroupsResource } from "../src/resources/family-library-groups.ts";
import type { HttpClient } from "../src/http-client.ts";

describe("FamilyLibraryGroupsResource", () => {
  let groups: FamilyLibraryGroupsResource;
  let mockClient: HttpClient;

  beforeEach(() => {
    mockClient = {
      request: mock(() => Promise.resolve({})),
    } as unknown as HttpClient;
    groups = new FamilyLibraryGroupsResource(mockClient);
  });

  test("list should fetch all groups", async () => {
    const mockGroups = [
      {
        id: "g1",
        name: "Favorites",
        familyId: "fam123",
        imageId: "fp-cards",
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        lastModifiedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "g2",
        name: "Bedtime",
        familyId: "fam123",
        imageId: "fp-cards",
        items: [],
        createdAt: "2024-01-01T00:00:00Z",
        lastModifiedAt: "2024-01-01T00:00:00Z",
      },
    ];
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockGroups,
    );

    const result = await groups.list();

    expect(mockClient.request).toHaveBeenCalledWith(
      "/card/family/library/groups",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual(mockGroups);
  });

  test("create should post new group", async () => {
    const newGroup = {
      name: "New Collection",
      imageId: "fp-cards",
      items: [{ contentId: "abc" }, { contentId: "def" }],
    };
    const mockResponse = {
      id: "g3",
      name: "New Collection",
      imageId: "fp-cards",
      items: [
        { contentId: "abc", addedAt: "2024-01-01T00:00:00Z" },
        { contentId: "def", addedAt: "2024-01-01T00:00:00Z" },
      ],
      familyId: "fam123",
      createdAt: "2024-01-01T00:00:00Z",
      lastModifiedAt: "2024-01-01T00:00:00Z",
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockResponse,
    );

    const result = await groups.create(newGroup);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/card/family/library/groups",
      expect.objectContaining({
        method: "POST",
        body: newGroup,
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  test("retrieve should fetch group by ID", async () => {
    const mockGroup = {
      id: "g1",
      name: "Favorites",
      imageId: "fp-cards",
      items: [{ contentId: "abc", addedAt: "2024-01-01T00:00:00Z" }],
      familyId: "fam123",
      createdAt: "2024-01-01T00:00:00Z",
      lastModifiedAt: "2024-01-01T00:00:00Z",
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockGroup,
    );

    const result = await groups.retrieve("g1");

    expect(mockClient.request).toHaveBeenCalledWith("/card/family/library/groups/g1", {
      method: "GET",
    });
    expect(result).toEqual(mockGroup);
  });

  test("update should put group changes", async () => {
    const updates = {
      name: "Updated Name",
      imageId: "fp-cards",
      items: [],
    };
    const mockResponse = {
      id: "g1",
      name: "Updated Name",
      imageId: "fp-cards",
      items: [],
      familyId: "fam123",
      createdAt: "2024-01-01T00:00:00Z",
      lastModifiedAt: "2024-01-01T00:00:00Z",
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockResponse,
    );

    const result = await groups.update("g1", updates);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/card/family/library/groups/g1",
      expect.objectContaining({
        method: "PUT",
        body: updates,
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  test("remove should delete group", async () => {
    await groups.remove("g1");

    expect(mockClient.request).toHaveBeenCalledWith("/card/family/library/groups/g1", {
      method: "DELETE",
    });
  });
});

