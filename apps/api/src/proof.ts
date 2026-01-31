import { keccak256, toUtf8Bytes } from "ethers";
import type { ProofResult } from "./types";

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function buildPayload(normalizedAddress: string, chainId: string): string {
  return `ens-proof-of-usage:v1:${chainId}:${normalizedAddress}`;
}

export function generateDeterministicProof(
  resolvedAddress: string,
  chainId: string
): ProofResult {
  const normalizedAddress = normalizeAddress(resolvedAddress);
  const payload = buildPayload(normalizedAddress, chainId);
  const proofHash = keccak256(toUtf8Bytes(payload));
  const hashInt = BigInt(proofHash);
  const score = Number(hashInt % 101n);

  const usageTag = score >= 70 ? "usage:high" : score >= 40 ? "usage:medium" : "usage:low";
  const riskBucket = Number(hashInt % 3n);
  const riskTag =
    riskBucket === 0
      ? "farming-risk:low"
      : riskBucket === 1
        ? "farming-risk:med"
        : "farming-risk:high";

  return {
    proofHash,
    score,
    tags: [usageTag, riskTag]
  };
}
