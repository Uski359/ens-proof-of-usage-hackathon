import cors from "cors";
import express from "express";
import { ApiError, toErrorResponse } from "./errors";
import { resolveEnsOrAddress } from "./ens";
import { generateDeterministicProof } from "./proof";
import type { ProofResponse } from "./types";

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/proof", async (req, res) => {
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
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10) || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
