"use client";

import { useState } from "react";

type ProofResponse = {
  input: {
    ensOrAddress: string;
    resolvedAddress: string;
    source: "ens" | "address";
  };
  proof: {
    proofHash: string;
    score: number;
    tags: string[];
  };
  meta: {
    deterministic: boolean;
    version: string;
  };
};

export default function ProofDemoPage() {
  const [ensOrAddress, setEnsOrAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProofResponse | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!apiBaseUrl) {
      setError("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return;
    }

    if (!ensOrAddress.trim()) {
      setError("Enter an ENS name or 0x address.");
      return;
    }

    setData(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensOrAddress })
      });
      const payload = (await response.json()) as ProofResponse | { error?: { message?: string } };

      if (!response.ok) {
        const message = "error" in payload && payload.error?.message
          ? payload.error.message
          : "Failed to generate proof.";
        throw new Error(message);
      }

      setData(payload as ProofResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Deterministic Proof Demo</h1>
      <p>
        Enter an ENS name or wallet address. ENS resolution is used for UX; the proof only
        uses the resolved address.
      </p>
      <div className="badge-row">
        <span className="badge-inline">ENS (UX only)</span>
        <span className="badge-inline">Deterministic ✔</span>
        <span className="badge-inline">Proof ≠ AI</span>
      </div>

      <form className="section" onSubmit={handleSubmit}>
        <div className="input-row">
          <input
            value={ensOrAddress}
            onChange={(event) => setEnsOrAddress(event.target.value)}
            placeholder="vitalik.eth or 0xabc..."
            aria-label="ENS name or wallet address"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Generating deterministic proof..." : "Generate Proof"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <div className="card info-box">
        <p className="note">
          We intentionally limited this demo to the deterministic core. ENS improves UX, but the
          proof itself remains fully reproducible.
        </p>
      </div>

      {data ? (
        <div className="section">
          <div className="card">
            <div className="card-title">
              <h2>Step 1 — ENS Resolution (UX Only)</h2>
              {data.input.source === "ens" ? (
                <span className="badge-inline">Resolved from ENS (UX only)</span>
              ) : null}
            </div>
            <div className="output-grid">
              <div>
                <div className="output-key">Resolved Address</div>
                <div className="output-value">{data.input.resolvedAddress}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h2>Step 2 — Deterministic Proof Output</h2>
              <span className="badge-inline">Deterministic ✔</span>
            </div>
            <div className="output-grid">
              <div>
                <div className="output-key">Proof Hash</div>
                <div className="output-value">{data.proof.proofHash}</div>
              </div>
              <div>
                <div className="output-key">Score</div>
                <div className="output-value">{data.proof.score}</div>
              </div>
              <div>
                <div className="output-key">Tags</div>
                <div className="output-value">{data.proof.tags.join(", ")}</div>
              </div>
            </div>
            <p className="subtle">
              Proofs are generated only from the resolved wallet address. ENS is used for UX only
              and is not part of the proof input.
            </p>
            <p className="subtle">Same input always produces the same proof.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
