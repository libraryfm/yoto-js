export class YotoError extends Error {
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly type: string;
  public readonly code?: string;
  public readonly url?: string;
  public readonly method?: string;

  constructor(
    message: string,
    statusCode?: number,
    type?: string,
    code?: string,
    requestId?: string,
    url?: string,
    method?: string,
  ) {
    super(message);
    this.name = "YotoError";
    this.statusCode = statusCode;
    this.type = type || "api_error";
    this.code = code;
    this.requestId = requestId;
    this.url = url;
    this.method = method;
    Object.setPrototypeOf(this, YotoError.prototype);
  }
}

export class YotoAuthenticationError extends YotoError {
  constructor(
    message: string,
    code?: string,
    requestId?: string,
    url?: string,
    method?: string,
  ) {
    super(message, 401, "authentication_error", code, requestId, url, method);
    this.name = "YotoAuthenticationError";
    Object.setPrototypeOf(this, YotoAuthenticationError.prototype);
  }
}

export class YotoAPIError extends YotoError {
  constructor(
    message: string,
    statusCode: number,
    type?: string,
    code?: string,
    requestId?: string,
    url?: string,
    method?: string,
  ) {
    super(
      message,
      statusCode,
      type || "api_error",
      code,
      requestId,
      url,
      method,
    );
    this.name = "YotoAPIError";
    Object.setPrototypeOf(this, YotoAPIError.prototype);
  }
}

export class YotoConnectionError extends YotoError {
  constructor(message: string) {
    super(message, undefined, "connection_error");
    this.name = "YotoConnectionError";
    Object.setPrototypeOf(this, YotoConnectionError.prototype);
  }
}

export class YotoRateLimitError extends YotoError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    retryAfter?: number,
    code?: string,
    requestId?: string,
    url?: string,
    method?: string,
  ) {
    super(message, 429, "rate_limit_error", code, requestId, url, method);
    this.name = "YotoRateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, YotoRateLimitError.prototype);
  }
}
