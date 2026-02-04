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

const isBatchProofSuccess = (
  result: BatchProofSuccess | BatchProofError
): result is BatchProofSuccess => !("error" in result);

const escapeCsvValue = (value: string | number) => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
};

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const formatTagLabel = (tag: string) => {
  const [rawKey, rawValue] = tag.split(":");
  if (!rawValue) {
    return toTitleCase(tag.replace(/[-_]/g, " "));
  }
  const key = toTitleCase(rawKey.replace(/[-_]/g, " ").trim());
  const value = toTitleCase(rawValue.replace(/[-_]/g, " ").trim());
  return `${value} ${key}`.trim();
};

const getTagMeta = (tag: string) => {
  const [rawKey, rawValue] = tag.split(":");
  const key = rawKey ? rawKey.trim().toLowerCase() : "unknown";
  const value = rawValue ? rawValue.trim().toLowerCase() : "unknown";
  return { key, value, label: formatTagLabel(tag) };
};

const buildCsv = (results: BatchProofSuccess[]) => {
  const header = "input,resolved_address,proof_hash,score,tags,policy_version";
  const rows = results.map((result) => {
    const columns = [
      result.input,
      result.resolvedAddress,
      result.proofHash,
      result.score,
      result.tags.join("|"),
      "v1"
    ];
    return columns.map(escapeCsvValue).join(",");
  });

  return [header, ...rows].join("\n");
};

const isEnsLikeInput = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith("0x")) {
    return false;
  }
  return normalized.includes(".");
};

export default function ProofDemoPage() {
  const [inputsText, setInputsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BatchProofResponse | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const successfulResults = data?.results.filter(isBatchProofSuccess) ?? [];

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

  const handleDownloadCsv = () => {
    if (successfulResults.length === 0) {
      return;
    }

    const csv = buildCsv(successfulResults);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ens-proof-of-usage.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

      <form className="section input-panel" onSubmit={handleSubmit}>
        <div className="input-card">
          <div className="input-header">
            <div>
              <p className="input-kicker">Batch inputs</p>
              <h3>Paste wallets or ENS names</h3>
              <p className="subtle">One per line. Commas and spaces also work.</p>
            </div>
            <span className="badge-inline">Batch</span>
          </div>
          <div className="input-row">
            <textarea
              value={inputsText}
              onChange={(event) => setInputsText(event.target.value)}
              placeholder={"vitalik.eth\n0xabc...\n0xdef..."}
              aria-label="ENS names or wallet addresses"
              rows={4}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Generating deterministic proofs..." : "Generate Proofs"}
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={loading || successfulResults.length === 0}
            >
              Download CSV
            </button>
          </div>
          <p className="subtle csv-helper">
            Export deterministic proofs for off-chain eligibility pipelines.
          </p>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      {data ? (
        <div className="section">
          <div className="card">
            <div className="card-title">
              <h2>Results</h2>
            </div>
            <p className="subtle">
              ENS is treated as an identity abstraction layer, not a trust assumption.
              Proofs remain protocol-agnostic, deterministic, and reproducible.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <h2>ENS Identity Context</h2>
            </div>
            <div className="identity-grid">
              {data.results.map((result, index) => {
                const inputValue = result.input || "Invalid input";
                const isEns = isEnsLikeInput(inputValue);
                const resolvedAddress = isBatchProofSuccess(result)
                  ? result.resolvedAddress
                  : "Unavailable";
                return (
                  <div className="identity-row" key={`identity-${inputValue}-${index}`}>
                    <div className="identity-meta">
                      <div className="identity-input">{inputValue}</div>
                      <div className="identity-address mono">{resolvedAddress}</div>
                    </div>
                    <span className="badge-inline">
                      {isEns ? "Identity-based (ENS)" : "Address-based"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="subtle">
              ENS is used to abstract identity for humans. Eligibility proofs are generated
              solely from the resolved wallet address.
            </p>
          </div>
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
                  <span className="badge-inline badge-soft">Deterministic ✓</span>
                </div>
                <div className="signal-section">
                  <div className="signal-title">Policy Signals</div>
                  <div className="signal-list">
                    {result.tags.length > 0 ? (
                      result.tags.map((tag) => {
                        const meta = getTagMeta(tag);
                        return (
                          <span
                            className="signal-pill"
                            data-key={meta.key}
                            data-value={meta.value}
                            key={`${result.input}-${tag}`}
                          >
                            {meta.label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="subtle">No policy signals available.</span>
                    )}
                  </div>
                  <p className="signal-helper">
                    These signals are derived deterministically from on-chain usage patterns.
                  </p>
                </div>
                <div className="output-grid">
                  <div>
                    <div className="output-key">Resolved Address</div>
                    <div className="output-value mono copyable">{result.resolvedAddress}</div>
                  </div>
                  <div>
                    <div className="output-key">Proof Hash</div>
                    <div className="output-value mono copyable">{result.proofHash}</div>
                    <div className="output-note">Deterministic proof identifier</div>
                  </div>
                  <div>
                    <div className="output-key">Score</div>
                    <div className="output-value score-value">{result.score}</div>
                  </div>
                </div>
                <p className="subtle result-ens-note">
                  ENS is used for identity abstraction only. Proofs are generated solely from the
                  resolved wallet address.
                </p>
                <div className="interpretation">
                  <div className="interpretation-title">Eligibility Interpretation (Example)</div>
                  <p className="interpretation-body">
                    {result.score >= 20
                      ? "Likely suitable for long-term incentive or loyalty-based programs."
                      : "May be filtered for short-term or farming-related behavior."}
                  </p>
                  <p className="subtle interpretation-disclaimer">
                    This interpretation is illustrative only and does not trigger any on-chain action.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
