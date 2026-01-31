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
