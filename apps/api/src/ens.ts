import { JsonRpcProvider } from "ethers";
import { ApiError } from "./errors";
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
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      const error = new Error("RPC_URL is required to resolve ENS names.") as Error & {
        statusCode?: number;
        code?: string;
      };
      error.statusCode = 500;
      error.code = "RPC_URL_MISSING";
      throw error;
    }
    const provider = new JsonRpcProvider(rpcUrl);
    let resolved: string | null;
    try {
      resolved = await provider.resolveName(trimmed);
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
    if (!resolved) {
      const error = new Error("ENS name not found.") as Error & {
        statusCode?: number;
        code?: string;
      };
      error.statusCode = 404;
      error.code = "ENS_NOT_FOUND";
      throw error;
    }

    return {
      resolvedAddress: resolved.toLowerCase(),
      source: "ens"
    };
  }

  throw new ApiError("INVALID_INPUT", "Input must be a valid 0x address or ENS name.", 400);
}
