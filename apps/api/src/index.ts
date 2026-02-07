import cors from "cors";
import express from "express";
import pLimit from "p-limit";
import { ApiError } from "./errors";
import { resolveEnsOrAddress } from "./ens";
import { generateDeterministicProof } from "./proof";
import type { BatchProofResponse, BatchProofSuccess, ProofResponse } from "./types";

const app = express();
const addressPattern = /^0x[a-fA-F0-9]{40}$/;

const isEnsLikeInput = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (addressPattern.test(normalized)) {
    return false;
  }
  return normalized.endsWith(".eth") || normalized.includes(".");
};

app.use(express.json({ limit: "100kb" }));
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function getErrorDetails(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message
    };
  }

  const code =
    typeof (error as { code?: unknown })?.code === "string"
      ? (error as { code: string }).code
      : "INTERNAL_ERROR";
  const message =
    typeof (error as { message?: unknown })?.message === "string" && (error as { message?: string }).message
      ? (error as { message: string }).message
      : "Unexpected error";

  return { code, message };
}

async function buildBatchProof(input: string, chainId: string): Promise<BatchProofSuccess> {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    throw new ApiError("INVALID_INPUT", "Input is required.", 400);
  }

  const { resolvedAddress } = await resolveEnsOrAddress(trimmedInput);
  const proof = generateDeterministicProof(resolvedAddress, chainId);

  return {
    input: trimmedInput,
    resolvedAddress,
    proofHash: proof.proofHash,
    score: proof.score,
    tags: proof.tags,
    deterministic: true
  };
}

app.post("/api/proof", async (req, res, next) => {
  try {
    const { ensOrAddress } = req.body ?? {};
    if (typeof ensOrAddress !== "string") {
      throw new ApiError("INVALID_INPUT", "ensOrAddress must be a string.", 400);
    }
    const trimmedInput = ensOrAddress.trim();
    if (!trimmedInput) {
      throw new ApiError("INVALID_INPUT", "ensOrAddress is required.", 400);
    }

    const { resolvedAddress, source } = await resolveEnsOrAddress(trimmedInput);
    const chainId = process.env.CHAIN_ID ?? "1";
    const proof = generateDeterministicProof(resolvedAddress, chainId);

    const response: ProofResponse = {
      input: {
        ensOrAddress: trimmedInput,
        resolvedAddress,
        source
      },
      proof,
      meta: {
        deterministic: true,
        version: "v1"
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.post("/api/proof/batch", async (req, res, next) => {
  try {
    const { inputs } = req.body ?? {};
    if (!Array.isArray(inputs)) {
      throw new ApiError("INVALID_INPUT", "inputs must be an array of strings.", 400);
    }

    const chainId = process.env.CHAIN_ID ?? "1";
    const ensLimit = pLimit(1);
    const addrLimit = pLimit(2);
    const results = await Promise.all(
      inputs.map((input) => {
        if (typeof input !== "string") {
          return Promise.resolve({
            input: String(input),
            error: {
              code: "INVALID_INPUT",
              message: "Input must be a string."
            }
          });
        }

        const runner = isEnsLikeInput(input) ? ensLimit : addrLimit;
        return runner(async () => {
          try {
            return await buildBatchProof(input, chainId);
          } catch (error) {
            const { code, message } = getErrorDetails(error);
            const trimmedInput = input.trim();
            return {
              input: trimmedInput || input,
              error: {
                code,
                message
              }
            };
          }
        });
      })
    );

    const response: BatchProofResponse = {
      results,
      meta: {
        version: "v1"
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error({
    message: err?.message,
    code: err?.code,
    statusCode: err?.statusCode,
    stack: err?.stack
  });

  const statusCode = typeof err?.statusCode === "number"
    ? err.statusCode
    : typeof err?.status === "number"
      ? err.status
      : undefined;
  const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
  const message = typeof err?.message === "string" && err.message
    ? err.message
    : "Unexpected error";

  res.status(statusCode || 500).json({
    error: {
      code,
      message
    }
  });
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10) || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
