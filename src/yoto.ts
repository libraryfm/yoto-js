import type { AuthProvider } from "./auth-provider.ts";
import { StaticTokenProvider } from "./auth-provider.ts";
import { HttpClient } from "./http-client.ts";
import { ContentResource } from "./resources/content.ts";
import { DevicesResource } from "./resources/devices.ts";
import { FamilyResource } from "./resources/family.ts";
import { FamilyLibraryGroupsResource } from "./resources/family-library-groups.ts";
import { IconsResource } from "./resources/icons.ts";
import { MediaResource } from "./resources/media.ts";
import type { YotoConfig } from "./types";

interface YotoAuthConfig {
  accessToken?: string;
  auth?: AuthProvider;
}

export class Yoto {
  private httpClient: HttpClient;

  public readonly content: ContentResource;
  public readonly devices: DevicesResource;
  public readonly family: FamilyResource;
  public readonly familyLibraryGroups: FamilyLibraryGroupsResource;
  public readonly icons: IconsResource;
  public readonly media: MediaResource;

  constructor(config: YotoAuthConfig & Partial<YotoConfig>) {
    if (!config.accessToken && !config.auth) {
      throw new Error(
        "Either accessToken or auth must be provided. Example: new Yoto({ accessToken: 'your_token' })",
      );
    }

    if (config.accessToken && config.auth) {
      throw new Error(
        "Cannot provide both accessToken and auth. Use one or the other.",
      );
    }

    const authProvider: AuthProvider = config.auth
      ? config.auth
      : new StaticTokenProvider(config.accessToken as string);

    const yotoConfig: YotoConfig = {
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      headers: config.headers,
    };

    this.httpClient = new HttpClient(authProvider, yotoConfig);

    this.content = new ContentResource(this.httpClient);
    this.devices = new DevicesResource(this.httpClient);
    this.family = new FamilyResource(this.httpClient);
    this.familyLibraryGroups = new FamilyLibraryGroupsResource(this.httpClient);
    this.icons = new IconsResource(this.httpClient);
    this.media = new MediaResource(this.httpClient);
  }
}
