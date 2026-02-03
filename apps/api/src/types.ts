export type InputSource = "ens" | "address";

export type ProofInput = {
  ensOrAddress: string;
  resolvedAddress: string;
  source: InputSource;
};

export type ProofResult = {
  proofHash: string;
  score: number;
  tags: string[];
};

export type ProofResponse = {
  input: ProofInput;
  proof: ProofResult;
  meta: {
    deterministic: true;
    version: "v1";
  };
};

export type BatchProofRequest = {
  inputs: string[];
};

export type BatchProofSuccess = {
  input: string;
  resolvedAddress: string;
  proofHash: string;
  score: number;
  tags: string[];
  deterministic: true;
};

export type BatchProofError = {
  input: string;
  error: {
    code: string;
    message: string;
  };
};

export type BatchProofResult = BatchProofSuccess | BatchProofError;

export type BatchProofResponse = {
  results: BatchProofResult[];
  meta: {
    version: "v1";
  };
};
