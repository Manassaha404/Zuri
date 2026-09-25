import logger from "@repo/logger/logger";

export class AppError extends Error {
  constructor(
    public code:
      | "PARSE_ERROR"
      | "BAD_REQUEST"
      | "INTERNAL_SERVER_ERROR"
      | "NOT_IMPLEMENTED"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "METHOD_NOT_SUPPORTED"
      | "TIMEOUT"
      | "CONFLICT"
      | "PRECONDITION_FAILED"
      | "PAYLOAD_TOO_LARGE"
      | "UNSUPPORTED_MEDIA_TYPE"
      | "UNPROCESSABLE_CONTENT"
      | "TOO_MANY_REQUESTS"
      | "CLIENT_CLOSED_REQUEST",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
    logger.error(`[AppError] ${this.code}: ${message}`, {
      code: this.code,
      stack: this.stack,
    });
  }
}
