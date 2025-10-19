# yoto-js

Unofficial Node.js SDK for the Yoto API. Built with TypeScript and optimized for Bun runtime.

## Installation

```bash
# Using Bun
bun add yoto-js
  
# Using npm
npm install yoto-js

# Using yarn
yarn add yoto-js
```

## Quick Start

```typescript
import { Yoto } from "yoto-js";

const yoto = new Yoto({ accessToken: "your_access_token" });

// Get content
const content = await yoto.content.get("content_id");

// List devices
const devices = await yoto.devices.list();

// Send device command
await yoto.devices.sendCommand("device_id", { command: "play" });
```

## Authentication

The SDK supports multiple authentication methods. All methods use OAuth 2.0 bearer tokens. 

**Get your credentials:** Before using any authentication method, obtain your client ID and client secret from the [Yoto Developer Portal](https://yoto.dev/get-started/start-here/).

Choose the approach that fits your use case:

### Using a Static Access Token

If you already have an access token (e.g., from manual OAuth flow or testing):

```typescript
const yoto = new Yoto({ accessToken: "your_access_token" });
```

Note: Static tokens don't auto-refresh. For production apps, use an auth provider (see below).

### Device Code Flow (CLI/Headless Apps)

For command-line tools and server-side applications without a browser UI, use the device code flow with automatic token refresh:

```typescript
import { YotoDeviceAuth, Yoto } from "yoto-js";

// Initialize auth client with your client ID
const auth = new YotoDeviceAuth("your-client-id");

// Start device login
const deviceCode = await auth.initiateDeviceLogin();

// Display to user
console.log("Visit:", deviceCode.verification_uri);
console.log("Enter code:", deviceCode.user_code);

// Poll for completion
const tokens = await auth.pollForToken(
  deviceCode.device_code,
  deviceCode.interval
);

// Create auth provider with automatic token refresh (recommended)
const authProvider = auth.createProvider(tokens);
const yoto = new Yoto({ auth: authProvider });

// The client will automatically refresh tokens as needed
await yoto.content.listMYO(); // Works indefinitely

// Alternative: Manual token management
const yotoManual = new Yoto({ accessToken: tokens.access_token });
// You must manually check expiration and refresh:
if (auth.isTokenExpired(tokens.access_token)) {
  const newTokens = await auth.refreshToken(tokens.refresh_token);
  // Create new client with refreshed token
}
```

See [examples/device-auth-example.ts](examples/device-auth-example.ts) for a complete example.

Learn more: [Yoto Device Code Authentication](https://yoto.dev/authentication/headless-cli-auth/)

### Browser-Based Flow (Web Apps)

For web applications, use the PKCE-based browser flow with automatic token refresh:

```typescript
import { YotoBrowserAuth, Yoto } from "yoto-js";

// Initialize auth client
const auth = new YotoBrowserAuth(
  "your-client-id",
  "https://your-app.com/callback"
);

// Step 1: Generate auth URL
const { url, codeVerifier } = await auth.generateAuthUrl();

// Store verifier and redirect
sessionStorage.setItem("pkce_code_verifier", codeVerifier);
window.location.href = url;

// Step 2: On callback, exchange code for tokens
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const storedVerifier = sessionStorage.getItem("pkce_code_verifier");

const tokens = await auth.exchangeCodeForTokens(code, storedVerifier);

// Create auth provider with automatic token refresh (recommended)
const authProvider = auth.createProvider(tokens);
const yoto = new Yoto({ auth: authProvider });

// The client will automatically refresh tokens as needed
await yoto.content.listMYO(); // Works indefinitely
```

See [examples/browser-auth-example.ts](examples/browser-auth-example.ts) for a complete example.

Learn more: [Yoto Browser Authentication](https://yoto.dev/authentication/browser-auth/)

### Configuration Options

All clients support custom configuration:

```typescript
const yoto = new Yoto({
  accessToken: "your_access_token",
  baseUrl: "https://api.yotoplay.com", // Custom API base URL (default)
  timeout: 30000, // Request timeout in milliseconds (default: 30000)
  maxRetries: 3, // Maximum retry attempts (default: 3)
  headers: {
    // Custom headers
    "X-Custom-Header": "value",
  },
});

// Auth clients also support configuration
const auth = new YotoDeviceAuth("client-id", {
  authBaseUrl: "https://login.yotoplay.com", // Custom auth URL
  apiAudience: "https://api.yotoplay.com", // API audience
  timeout: 30000, // Request timeout
});
```

### Custom Auth Providers

Implement the `AuthProvider` interface for custom authentication:

```typescript
import { AuthProvider, Yoto } from "yoto-js";

class CustomAuthProvider implements AuthProvider {
  async getAccessToken(): Promise<string> {
    // Your custom logic to obtain/refresh tokens
    return "access_token";
  }
}

const yoto = new Yoto({ auth: new CustomAuthProvider() });
```

## API Reference

### Content

Manage Make Your Own (MYO) content.

```typescript
// Get content by ID
const content = await yoto.content.get("content_id");

// Create content with uploaded audio
const newContent = await yoto.content.create({
  title: "My Playlist",
  content: {
    chapters: [
      {
        key: "01",
        title: "Chapter 1",
        overlayLabel: "1",
        display: { icon16x16: null },
        tracks: [
          {
            key: "01",
            title: "Track 1",
            trackUrl: "yoto:#<sha256-hash>",
            overlayLabel: "1",
            duration: 180,
            fileSize: 2048000,
            channels: 2,
            format: "mp3",
            type: "audio",
          },
        ],
      },
    ],
  },
  metadata: {
    description: "A collection of favorite songs",
  },
});

// Create content with streaming tracks
const streamingContent = await yoto.content.create({
  title: "Weather Updates",
  content: {
    chapters: [
      {
        key: "01",
        title: "Live Weather",
        overlayLabel: "1",
        display: { icon16x16: null },
        tracks: [
          {
            key: "01",
            title: "Current Weather",
            trackUrl: "https://example.com/weather-stream.mp3",
            type: "stream",
            format: "mp3",
            overlayLabel: "1",
            duration: 0,
            fileSize: 0,
            channels: 2,
            display: {
              icon16x16: "yoto:#<icon-hash>",
            },
          },
        ],
      },
    ],
  },
  metadata: {
    description: "Dynamic weather updates",
  },
});

// Update content
const updated = await yoto.content.update("content_id", {
  title: "Updated Title",
});

// Delete content
await yoto.content.delete("content_id");

// List MYO content
const myoContent = await yoto.content.listMYO();
```

### Devices

Control and configure Yoto devices.

```typescript
// List all devices
const devices = await yoto.devices.list();

// Get device status
const status = await yoto.devices.getStatus("device_id");

// Get device configuration
const config = await yoto.devices.getConfig("device_id");

// Update device configuration
await yoto.devices.updateConfig("device_id", {
  name: "Living Room Player",
  volume: 50,
  maxVolume: 80,
  nightLightEnabled: true,
});

// Send command to device
await yoto.devices.sendCommand("device_id", { command: "play" });
// Available commands: play, pause, next, previous, volumeUp, volumeDown, stop

// Update shortcuts (beta)
await yoto.devices.updateShortcuts("device_id", {
  shortcuts: [
    { position: 1, contentId: "content_id_1" },
    { position: 2, contentId: "content_id_2" },
  ],
});
```

### Family

Manage family images.

```typescript
// List all family images
const images = await yoto.family.listImages();

// Get specific image
const image = await yoto.family.getImage("image_id");

// Upload image
const uploaded = await yoto.family.uploadImage(fileBuffer, "family-photo.jpg");
```

### Family Library Groups

Organize content into groups.

```typescript
// List all groups
const groups = await yoto.familyLibraryGroups.list();

// Create group
const group = await yoto.familyLibraryGroups.create({
  name: "Bedtime Stories",
  description: "Stories for bedtime",
  items: [
    { contentId: "content_1" },
    { contentId: "content_2" },
  ],
});

// Get group
const group = await yoto.familyLibraryGroups.get("group_id");

// Update group
await yoto.familyLibraryGroups.update("group_id", {
  name: "Updated Name",
});

// Delete group
await yoto.familyLibraryGroups.delete("group_id");
```

### Icons

Manage content icons.

```typescript
// List public icons
const publicIcons = await yoto.icons.listPublic();

// List user icons
const userIcons = await yoto.icons.listUser();

// Upload custom icon
const icon = await yoto.icons.upload(iconBuffer, "my-icon");
```

### Media

Handle media uploads.

```typescript
// Audio upload workflow
// 1. Get upload URL
const { upload } = await yoto.media.getAudioUploadUrl();

// 2. Upload audio file to the URL (using fetch or other HTTP client)
await fetch(upload.uploadUrl, {
  method: "PUT",
  body: audioFileBuffer,
  headers: { "Content-Type": "audio/mpeg" },
});

// 3. Poll for transcode completion
let transcoded = null;
while (!transcoded) {
  const status = await yoto.media.getTranscodeStatus(upload.uploadId);
  if (status.transcode.transcodedSha256) {
    transcoded = status.transcode;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// 4. Use the transcoded SHA256 in your content
const trackUrl = `yoto:#${transcoded.transcodedSha256}`;

// Upload cover image
const { coverImage } = await yoto.media.uploadCoverImage(imageBuffer, {
  autoconvert: true,
  coverType: "default",
});
// Use coverImage.mediaUrl in content metadata.cover.imageL
```


## Error Handling

The SDK provides specific error classes for different failure scenarios:

```typescript
import {
  YotoError,
  YotoAuthenticationError,
  YotoAPIError,
  YotoRateLimitError,
  YotoConnectionError,
} from "yoto-js";

try {
  const content = await yoto.content.get("invalid_id");
} catch (error) {
  if (error instanceof YotoAuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof YotoRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof YotoAPIError) {
    console.error(`API error: ${error.message} (${error.statusCode})`);
  } else if (error instanceof YotoConnectionError) {
    console.error("Connection failed");
  }
}
```

### Error Properties

All error classes extend `YotoError` and include:

- `message`: Error description
- `statusCode`: HTTP status code (when applicable)
- `type`: Error type identifier
- `requestId`: Yoto request ID for debugging

## Webhook Verification

Verify webhook signatures to ensure requests are from Yoto:

```typescript
import { constructEvent } from "yoto-js";

// In your webhook handler
app.post("/webhooks", (req, res) => {
  const signature = req.headers["yoto-signature"];
  const payload = req.body; // Raw body as string

  try {
    const event = constructEvent(payload, signature, "webhook_secret");

    // Process verified event
    console.log(event.type, event.data);

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook verification failed:", error.message);
    res.sendStatus(400);
  }
});
```

### Testing Webhooks

Generate test signatures for local testing:

```typescript
import { generateTestHeaderString } from "yoto-js";

const payload = { id: "evt_123", type: "content.created", data: {} };
const signature = generateTestHeaderString({
  payload: JSON.stringify(payload),
  secret: "webhook_secret",
});

// Use signature in test requests
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type { Content, Device, DeviceCommand } from "yoto-js";

const content: Content = await yoto.content.get("content_id");
const command: DeviceCommand = "play";
```

## Development

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

### Format & Lint

```bash
bun run format
bun run lint
bun run check
```

### E2E Validation

End-to-end validation scripts test real API interactions and ensure SDK types match actual API behavior. The Yoto developer documentation isn't always accurate or complete, so these scripts validate against live endpoints.

Create a `.env` file with your access token:

```bash
cp .env.example .env
# Edit .env and add your YOTO_ACCESS_TOKEN
```

Run validations:

```bash
# Validate content operations
bun run validate:content

# Validate family library groups
bun run validate:groups

# Validate family images
bun run validate:images

# Validate read-only endpoints
bun run validate:readonly

# Run all validations
bun run validate:all
```

## Requirements

- Node.js 18+ or Bun 1.0+
- TypeScript 5+ (for TypeScript users)

## License

MIT

## Resources

- [Yoto API Documentation](https://yoto.dev/api/)
- [Yoto Developer Portal](https://yoto.dev)
- [GitHub Repository](https://github.com/libraryfm/yoto-js)
- [Issue Tracker](https://github.com/libraryfm/yoto-js/issues)

## Contributing

Contributions are welcome!
