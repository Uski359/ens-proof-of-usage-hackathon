import { describe, expect, it } from "vitest";
import { keccak256, toUtf8Bytes } from "ethers";
import { buildPayload, generateDeterministicProof, normalizeAddress } from "../src/proof";

describe("generateDeterministicProof", () => {
  it("is deterministic for the same input", () => {
    const address = "0xAbCDEFabcdefABCDEFabcdefABCDEFabcdefABCD";
    const normalized = normalizeAddress(address);
    const chainId = "1";

    const first = generateDeterministicProof(normalized, chainId);
    const second = generateDeterministicProof(normalized, chainId);

    expect(second).toEqual(first);
  });

  it("derives score and tags from the proof hash", () => {
    const normalized = normalizeAddress("0x000000000000000000000000000000000000dEaD");
    const chainId = "1";

    const proof = generateDeterministicProof(normalized, chainId);

    const payload = buildPayload(normalized, chainId);
    const hash = keccak256(toUtf8Bytes(payload));
    const hashInt = BigInt(hash);
    const expectedScore = Number(hashInt % 101n);

    const usageTag =
      expectedScore >= 70 ? "usage:high" : expectedScore >= 40 ? "usage:medium" : "usage:low";
    const riskBucket = Number(hashInt % 3n);
    const riskTag =
      riskBucket === 0
        ? "farming-risk:low"
        : riskBucket === 1
          ? "farming-risk:med"
          : "farming-risk:high";

    expect(proof.proofHash).toBe(hash);
    expect(proof.score).toBe(expectedScore);
    expect(proof.tags).toEqual([usageTag, riskTag]);
  });
});
