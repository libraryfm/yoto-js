import type { HttpClient } from "./http-client.ts";

export class YotoResource {
  protected client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  protected async get<T>(
    path: string,
    query?: Record<string, unknown>,
  ): Promise<T> {
    return this.client.request<T>(path, {
      method: "GET",
      query: query as Record<string, string | number | boolean | undefined>,
    });
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    return this.client.request<T>(path, {
      method: "POST",
      body,
    });
  }

  protected async put<T>(path: string, body?: unknown): Promise<T> {
    return this.client.request<T>(path, {
      method: "PUT",
      body,
    });
  }

  protected async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.client.request<T>(path, {
      method: "PATCH",
      body,
    });
  }

  protected async delete<T>(path: string): Promise<T> {
    return this.client.request<T>(path, {
      method: "DELETE",
    });
  }
}
