"use client";

import { useState } from "react";

const POLICY_VERSION = "v1";
const addressPattern = /^0x[a-fA-F0-9]{40}$/;

type ProofResponse = {
  proof: {
    proofHash: string;
  };
};

export default function VerifyProofPage() {
  const [addressInput, setAddressInput] = useState("");
  const [proofHashInput, setProofHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ computedHash: string; match: boolean } | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!apiBaseUrl) {
      setError("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return;
    }

    const trimmedAddress = addressInput.trim();
    if (!trimmedAddress) {
      setError("Wallet address is required.");
      return;
    }

    if (!addressPattern.test(trimmedAddress)) {
      setError("Enter a valid 0x wallet address.");
      return;
    }

    const trimmedProofHash = proofHashInput.trim();
    if (!trimmedProofHash) {
      setError("Proof hash is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ensOrAddress: trimmedAddress })
      });
      const payload = (await response.json()) as ProofResponse | { error?: { message?: string } };

      if (!response.ok) {
        const message = "error" in payload && payload.error?.message
          ? payload.error.message
          : "Failed to verify proof.";
        throw new Error(message);
      }

      if (!("proof" in payload) || !payload.proof?.proofHash) {
        throw new Error("No proof returned.");
      }

      const computedHash = payload.proof.proofHash;
      setResult({
        computedHash,
        match: computedHash === trimmedProofHash
      });
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
        <a className="link-secondary back-link" href="/demo/proof">
          Back to Demo
        </a>
        <h1>Verify Deterministic Proof</h1>
        <p className="lead">
          Recompute the proof using the same deterministic policy and compare results.
        </p>
      </section>

      <div className="card verify-card" style={{ marginTop: "24px" }}>
        <div className="card-title">
          <h2>Verification Input</h2>
          <span className="badge-inline badge-soft">Read-only</span>
        </div>
        <form className="verify-form" onSubmit={handleSubmit}>
          <div className="verify-grid">
            <label className="verify-field">
              <span className="verify-label">Wallet Address</span>
              <input
                value={addressInput}
                onChange={(event) => setAddressInput(event.target.value)}
                placeholder="0x..."
                aria-label="Wallet address"
              />
            </label>
            <label className="verify-field">
              <span className="verify-label">Policy Version</span>
              <select value={POLICY_VERSION} disabled aria-label="Policy version">
                <option value={POLICY_VERSION}>{POLICY_VERSION}</option>
              </select>
            </label>
          </div>
          <label className="verify-field">
            <span className="verify-label">Proof Hash</span>
            <input
              value={proofHashInput}
              onChange={(event) => setProofHashInput(event.target.value)}
              placeholder="0x..."
              aria-label="Proof hash"
            />
          </label>
          <div className="verify-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Proof"}
            </button>
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {result ? (
          <div className="verify-output">
            <div className="verify-output-item">
              <div className="output-key">Computed Proof Hash</div>
              <div className="output-value mono copyable">{result.computedHash}</div>
            </div>
            <div className="verify-output-item">
              <div className="output-key">Match Status</div>
              <span className={`match-pill ${result.match ? "match-match" : "match-mismatch"}`}>
                {result.match ? "Match ✓" : "Mismatch ✕"}
              </span>
            </div>
            <p className="subtle">
              Verification recomputes the proof using the same deterministic logic.
              <br />
              No state is stored, and no trust assumption is introduced.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
