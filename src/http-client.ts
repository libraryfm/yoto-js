import type { AuthProvider } from "./auth-provider.ts";
import {
  YotoAPIError,
  YotoAuthenticationError,
  YotoConnectionError,
  YotoRateLimitError,
} from "./error.ts";
import type { RequestOptions, YotoConfig, YotoErrorResponse } from "./types";
import { VERSION } from "./version.ts";

const DEFAULT_BASE_URL = "https://api.yotoplay.com";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;

export class HttpClient {
  private readonly authProvider: AuthProvider;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly headers: Record<string, string>;

  constructor(authProvider: AuthProvider, config: YotoConfig) {
    this.authProvider = authProvider;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
    this.headers = {
      "Content-Type": "application/json",
      "User-Agent": `yoto-js/${VERSION}`,
      ...config.headers,
    };
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const method = options.method || "GET";

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const accessToken = await this.authProvider.getAccessToken();

        // Determine if body is binary (Buffer or Blob) or JSON
        const isBinary =
          options.body instanceof Buffer || options.body instanceof Blob;

        // Build headers: start with defaults, add auth, then options
        const requestHeaders: Record<string, string> = {
          Authorization: `Bearer ${accessToken}`,
        };

        // For binary uploads, only add Content-Type if explicitly provided in options
        if (isBinary) {
          if (options.headers?.["Content-Type"]) {
            requestHeaders["Content-Type"] = options.headers["Content-Type"];
          }
          // Add other default headers except Content-Type
          for (const [key, value] of Object.entries(this.headers)) {
            if (key !== "Content-Type") {
              requestHeaders[key] = value;
            }
          }
          // Add other option headers except Content-Type (already added if provided)
          if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
              if (key !== "Content-Type") {
                requestHeaders[key] = value;
              }
            }
          }
        } else {
          // For non-binary requests, use all headers normally
          Object.assign(requestHeaders, this.headers, options.headers);
        }

        // Prepare body based on type
        let requestBody: Buffer | Blob | string | undefined;
        if (isBinary) {
          requestBody = options.body as Buffer | Blob;
        } else if (options.body) {
          requestBody = JSON.stringify(options.body);
        }

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response, url, method);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof YotoAuthenticationError ||
          error instanceof YotoConnectionError
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          if (error instanceof YotoRateLimitError) {
            const delay = this.calculateRetryDelay(attempt, error.retryAfter);
            await this.sleep(delay);
            continue;
          }

          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError || new YotoConnectionError("Request failed after retries");
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async handleErrorResponse(
    response: Response,
    url: string,
    method: string,
  ): Promise<never> {
    const requestId = response.headers.get("X-Request-Id") || undefined;

    let errorData: YotoErrorResponse | undefined;
    try {
      errorData = (await response.json()) as YotoErrorResponse;
    } catch {
      // Response body is not JSON
    }

    const message =
      errorData?.error?.message || response.statusText || "Unknown error";
    const code = errorData?.error?.code;

    if (response.status === 401) {
      throw new YotoAuthenticationError(message, code, requestId, url, method);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter
        ? Number.parseInt(retryAfter, 10)
        : undefined;
      throw new YotoRateLimitError(
        message,
        retryAfterSeconds,
        code,
        requestId,
        url,
        method,
      );
    }

    throw new YotoAPIError(
      message,
      response.status,
      errorData?.error?.type,
      code,
      requestId,
      url,
      method,
    );
  }

  private calculateRetryDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000;
    }

    const baseDelay = 1000;
    const exponentialDelay = baseDelay * 2 ** attempt;
    const jitter = Math.random() * 1000;

    return Math.min(exponentialDelay + jitter, 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
