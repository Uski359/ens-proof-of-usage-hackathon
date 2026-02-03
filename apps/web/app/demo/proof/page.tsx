"use client";

import { useState } from "react";

type BatchProofSuccess = {
  input: string;
  resolvedAddress: string;
  proofHash: string;
  score: number;
  tags: string[];
  deterministic: true;
};

type BatchProofError = {
  input: string;
  error: {
    code: string;
    message: string;
  };
};

type BatchProofResponse = {
  results: Array<BatchProofSuccess | BatchProofError>;
  meta: {
    version: string;
  };
};

export default function ProofDemoPage() {
  const [inputsText, setInputsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BatchProofResponse | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!apiBaseUrl) {
      setError("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return;
    }

    const inputs = inputsText
      .split(/[,\s]+/g)
      .map((value) => value.trim())
      .filter(Boolean);

    if (inputs.length === 0) {
      setError("Enter one or more ENS names or 0x addresses.");
      return;
    }

    setData(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/proof/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs })
      });
      const payload = (await response.json()) as BatchProofResponse | { error?: { message?: string } };

      if (!response.ok) {
        const message = "error" in payload && payload.error?.message
          ? payload.error.message
          : "Failed to generate proof.";
        throw new Error(message);
      }

      setData(payload as BatchProofResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="hero">
        <a className="link-secondary back-link" href="/">
          Back to Home
        </a>
        <h1>ENS-aware Proof-of-Usage</h1>
        <p className="lead">
          Deterministic eligibility proofs for DeFi incentives using ENS for UX.
        </p>
        <p className="subtle">
          Enter an ENS name or wallet address. ENS resolution is used for UX; the proof only
          uses the resolved address.
        </p>
        <div className="badge-row">
          <span className="badge-inline">Resolved from ENS (UX only)</span>
          <span className="badge-inline">Deterministic ✔</span>
          <span className="badge-inline">Proof != AI</span>
        </div>
        <p className="subtle">Same input always produces the same proof.</p>
        <p className="subtle">Separate multiple inputs with commas, spaces, or new lines.</p>
      </section>

      <section className="section">
        <div className="card">
          <div className="card-title">
            <h2>Step 1 — ENS Resolution (UX Only)</h2>
            <span className="badge-inline">Resolved from ENS (UX only)</span>
          </div>
          <p className="subtle">
            Proofs are generated only from the resolved wallet address. ENS is used for UX only
            and is not part of the proof input.
          </p>
        </div>
        <div className="card">
          <div className="card-title">
            <h2>Step 2 — Deterministic Proof Output</h2>
            <span className="badge-inline">Deterministic ✔</span>
          </div>
          <p className="subtle">Same input always produces the same proof.</p>
        </div>
      </section>

      <form className="section" onSubmit={handleSubmit}>
        <div className="input-row">
          <input
            value={inputsText}
            onChange={(event) => setInputsText(event.target.value)}
            placeholder="vitalik.eth, 0xabc..., 0xdef..."
            aria-label="ENS names or wallet addresses"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Generating deterministic proofs..." : "Generate Proofs"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      {data ? (
        <div className="section">
          {data.results.map((result, index) => {
            if ("error" in result) {
              return (
                <div key={`${result.input}-${index}`} className="card">
                  <div className="card-title">
                    <h2>Input: {result.input || "Invalid input"}</h2>
                  </div>
                  <p className="error">
                    {result.error.code}: {result.error.message}
                  </p>
                </div>
              );
            }

            return (
              <div key={`${result.input}-${index}`} className="card">
                <div className="card-title">
                  <h2>Input: {result.input}</h2>
                  <span className="badge-inline">Deterministic ✔</span>
                </div>
                <div className="output-grid">
                  <div>
                    <div className="output-key">Resolved Address</div>
                    <div className="output-value">{result.resolvedAddress}</div>
                  </div>
                  <div>
                    <div className="output-key">Proof Hash</div>
                    <div className="output-value">{result.proofHash}</div>
                  </div>
                  <div>
                    <div className="output-key">Score</div>
                    <div className="output-value">{result.score}</div>
                  </div>
                  <div>
                    <div className="output-key">Tags</div>
                    <div className="output-value">{result.tags.join(", ")}</div>
                  </div>
                </div>
                <p className="subtle">Same input always produces the same proof.</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
