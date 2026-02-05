import { ApiError } from "./errors";
import { resolveEnsCached } from "./ensCache";
import { getProvider } from "./provider";
import type { InputSource } from "./types";

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

export type ResolveResult = {
  resolvedAddress: string;
  source: InputSource;
};

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
    const provider = getProvider();
    const resolved = await resolveEnsCached(trimmed, async (name) => {
      let resolvedName: string | null;
      try {
        resolvedName = await provider.resolveName(name);
      } catch (err) {
        const originalMessage = err instanceof Error ? err.message : "Unknown error";
        const error = new Error(`ENS resolution failed: ${originalMessage}`) as Error & {
          statusCode?: number;
          code?: string;
        };
        error.statusCode = 500;
        error.code = "ENS_RESOLVE_FAILED";
        throw error;
      }
      if (!resolvedName) {
        const error = new Error("ENS name not found.") as Error & {
          statusCode?: number;
          code?: string;
        };
        error.statusCode = 404;
        error.code = "ENS_NOT_FOUND";
        throw error;
      }
      return resolvedName.toLowerCase();
    });

    return {
      resolvedAddress: resolved,
      source: "ens"
    };
  }

  throw new ApiError("INVALID_INPUT", "Input must be a valid 0x address or ENS name.", 400);
}
