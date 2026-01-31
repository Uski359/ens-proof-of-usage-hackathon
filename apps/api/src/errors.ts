export type ErrorCode =
  | "INVALID_INPUT"
  | "ENS_NOT_FOUND"
  | "RPC_URL_MISSING"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  status: number;
  code: ErrorCode;

  constructor(code: ErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export function toErrorResponse(error: unknown): { status: number; body: ErrorResponse } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message
        }
      }
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error"
      }
    }
  };
}
