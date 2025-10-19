import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ContentResource } from "../src/resources/content.ts";
import type { HttpClient } from "../src/http-client.ts";

describe("ContentResource", () => {
  let content: ContentResource;
  let mockClient: HttpClient;

  beforeEach(() => {
    mockClient = {
      request: mock(() => Promise.resolve({})),
    } as unknown as HttpClient;
    content = new ContentResource(mockClient);
  });

  test("retrieve should fetch content by ID", async () => {
    const mockContent = {
      cardId: "abc123",
      title: "Test Content",
      content: { chapters: [] },
      metadata: {},
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce({
      card: mockContent,
    });

    const result = await content.retrieve("abc123");

    expect(mockClient.request).toHaveBeenCalledWith("/content/abc123", {
      method: "GET",
    });
    expect(result).toEqual(mockContent);
  });

  test("create should post new content", async () => {
    const newContent = {
      title: "New Playlist",
      content: {
        chapters: [
          {
            key: "ch1",
            title: "Chapter 1",
            tracks: [],
            display: { icon16x16: null },
          },
        ],
      },
    };

    await content.create(newContent);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/content",
      expect.objectContaining({
        method: "POST",
        body: newContent,
      }),
    );
  });

  test("update should post content changes", async () => {
    const updates = {
      title: "Updated Title",
    };

    await content.update("abc123", updates);

    expect(mockClient.request).toHaveBeenCalledWith(
      "/content",
      expect.objectContaining({
        method: "POST",
        body: {
          ...updates,
          cardId: "abc123",
        },
      }),
    );
  });

  test("remove should delete content", async () => {
    await content.remove("abc123");

    expect(mockClient.request).toHaveBeenCalledWith("/content/abc123", {
      method: "DELETE",
    });
  });

  test("listMYO should fetch user content", async () => {
    const mockList = {
      cards: [
        {
          cardId: "1",
          title: "Item 1",
          content: { chapters: [] },
          metadata: {},
        },
        {
          cardId: "2",
          title: "Item 2",
          content: { chapters: [] },
          metadata: {},
        },
      ],
    };
    (mockClient.request as ReturnType<typeof mock>).mockResolvedValueOnce(
      mockList,
    );

    const result = await content.listMYO();

    const call = (mockClient.request as ReturnType<typeof mock>).mock.calls[0];
    expect(call?.[0]).toBe("/content/mine");
    expect(call?.[1]?.method).toBe("GET");
    expect(result).toEqual(mockList.cards);
  });
});

