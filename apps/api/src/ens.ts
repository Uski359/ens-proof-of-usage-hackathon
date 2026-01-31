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
      throw new ApiError("RPC_URL_MISSING", "RPC_URL is required to resolve ENS names.", 500);
    }
    const provider = new JsonRpcProvider(rpcUrl);
    const resolved = await provider.resolveName(trimmed);
    if (!resolved) {
      throw new ApiError("ENS_NOT_FOUND", "ENS name not found.", 404);
    }

    return {
      resolvedAddress: resolved.toLowerCase(),
      source: "ens"
    };
  }

  throw new ApiError("INVALID_INPUT", "Input must be a valid 0x address or ENS name.", 400);
}
