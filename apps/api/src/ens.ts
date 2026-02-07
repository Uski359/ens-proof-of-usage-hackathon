import { ApiError } from "./errors";
import { resolveEnsCached } from "./ensCache";
import { getProvider } from "./provider";
import { isRateLimitError, withRetry } from "./retry";
import type { InputSource } from "./types";

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

export type ResolveResult = {
  resolvedAddress: string;
  source: InputSource;
};

export async function resolveEnsStable(name: string): Promise<string> {
  const provider = getProvider();
  const resolved = await resolveEnsCached(name, async (ensName) => {
    try {
      const resolvedName = await withRetry(async () => {
        const result = await provider.resolveName(ensName);
        if (!result) {
          const error = new Error("ENS name not found.") as Error & {
            statusCode?: number;
            code?: string;
          };
          error.statusCode = 404;
          error.code = "ENS_NOT_FOUND";
          throw error;
        }
        return result;
      });

      return resolvedName.toLowerCase();
    } catch (err) {
      const code = typeof (err as { code?: unknown })?.code === "string"
        ? (err as { code: string }).code
        : undefined;

      if (isRateLimitError(err)) {
        const error = new Error("ENS resolution temporarily rate-limited. Please retry.") as Error & {
          statusCode?: number;
          code?: string;
        };
        error.statusCode = 503;
        error.code = "ENS_RESOLVE_RATE_LIMITED";
        throw error;
      }

      if (code === "ENS_NOT_FOUND") {
        throw err;
      }

      const originalMessage = err instanceof Error ? err.message : "Unknown error";
      const error = new Error(`ENS resolution failed: ${originalMessage}`) as Error & {
        statusCode?: number;
        code?: string;
      };
      error.statusCode = 500;
      error.code = "ENS_RESOLVE_FAILED";
      throw error;
    }
  });

  return resolved;
}

export async function resolveEnsOrAddress(input: string): Promise<ResolveResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ApiError("INVALID_INPUT", "ensOrAddress is required.", 400);
  }

  if (addressPattern.test(trimmed)) {
    return {
      resolvedAddress: trimmed.toLowerCase(),
      source: "address"
    };
  }

  if (trimmed.includes(".")) {
    const resolved = await resolveEnsStable(trimmed);

    return {
      resolvedAddress: resolved,
      source: "ens"
    };
  }

  throw new ApiError("INVALID_INPUT", "Input must be a valid 0x address or ENS name.", 400);
}
