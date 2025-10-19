import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE = 300; // 5 minutes

export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  createdAt: string;
}

export interface ConstructEventOptions {
  tolerance?: number;
}

/**
 * Construct and verify a webhook event from raw payload
 * @param payload - Raw webhook payload (as string)
 * @param signature - Signature from webhook headers
 * @param secret - Webhook signing secret
 * @param options - Additional options
 * @returns Parsed and verified webhook event
 */
export function constructEvent<T = unknown>(
  payload: string,
  signature: string,
  secret: string,
  options: ConstructEventOptions = {},
): WebhookEvent<T> {
  const tolerance = options.tolerance ?? TIMESTAMP_TOLERANCE;

  if (!signature) {
    throw new Error("No signature provided");
  }

  const parts = signature.split(",");
  let timestamp: string | undefined;
  let providedSignature: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") {
      timestamp = value;
    } else if (key === "v1") {
      providedSignature = value;
    }
  }

  if (!timestamp || !providedSignature) {
    throw new Error("Invalid signature format");
  }

  const timestampSeconds = Number.parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);

  if (currentTime - timestampSeconds > tolerance) {
    throw new Error("Timestamp outside tolerance window");
  }

  const expectedSignature = computeSignature(timestamp, payload, secret);

  if (!secureCompare(expectedSignature, providedSignature)) {
    throw new Error("Signature verification failed");
  }

  let event: WebhookEvent<T>;
  try {
    event = JSON.parse(payload);
  } catch (_error) {
    throw new Error("Invalid JSON payload");
  }

  return event;
}

/**
 * Generate test webhook signature header for testing
 * @param payload - Webhook payload object or string
 * @param secret - Webhook signing secret
 * @returns Signature header string
 */
export function generateTestHeaderString(options: {
  payload: string | object;
  secret: string;
  timestamp?: number;
}): string {
  const { payload, secret, timestamp } = options;
  const payloadString =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  const timestampSeconds = timestamp || Math.floor(Date.now() / 1000);
  const signature = computeSignature(
    String(timestampSeconds),
    payloadString,
    secret,
  );

  return `t=${timestampSeconds},v1=${signature}`;
}

function computeSignature(
  timestamp: string,
  payload: string,
  secret: string,
): string {
  const signedPayload = `${timestamp}.${payload}`;
  return createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  return timingSafeEqual(bufferA, bufferB);
}
