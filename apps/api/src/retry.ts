const RETRIES = 3;
const BASE_DELAY_MS = 300;
const MAX_JITTER_MS = 150;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error: unknown) => {
  if (error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "";
};

const getErrorStatus = (error: unknown) => {
  const err = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };
  if (typeof err?.status === "number") {
    return err.status;
  }
  if (typeof err?.statusCode === "number") {
    return err.statusCode;
  }
  if (typeof err?.response?.status === "number") {
    return err.response.status;
  }
  return undefined;
};

export const isRateLimitError = (error: unknown) => {
  const message = getErrorMessage(error);
  if (/too many requests|429|rate limit/i.test(message)) {
    return true;
  }

  const code = typeof (error as { code?: unknown })?.code === "string"
    ? (error as { code: string }).code
    : undefined;
  const status = getErrorStatus(error);

  return code === "SERVER_ERROR" && status === 429;
};

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isRateLimitError(error) || attempt === RETRIES) {
        throw error;
      }

      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * MAX_JITTER_MS;
      await sleep(delay);
    }
  }

  throw new Error("Retry attempts exhausted.");
}
