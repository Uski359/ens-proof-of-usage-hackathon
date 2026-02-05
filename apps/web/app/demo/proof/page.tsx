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

const POLICY_VERSION = "v1";

const isBatchProofSuccess = (
  result: BatchProofSuccess | BatchProofError
): result is BatchProofSuccess => !("error" in result);

const normalizeBatchError = (error: BatchProofError["error"]) => {
  const code = error.code || "UNKNOWN_ERROR";
  const message = error.message || "";
  const isRateLimit = /too many requests|rate limit/i.test(message);

  if (code === "ENS_RESOLVE_FAILED" || isRateLimit) {
    return {
      title: "ENS Resolution Unavailable",
      message:
        "This ENS name could not be resolved right now due to RPC rate limits. No proof was generated for this input.",
      detailsCode: code
    };
  }

  if (code === "ENS_NOT_FOUND") {
    return {
      title: "ENS Name Not Found",
      message: "This ENS name could not be found. Check spelling and try again.",
      detailsCode: code
    };
  }

  return {
    title: "Unable to Generate Proof",
    message: "An unexpected error occurred while processing this input.",
    detailsCode: code
  };
};

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

const getEnsProfileUrl = (input: string) =>
  `https://app.ens.domains/name/${encodeURIComponent(input)}`;

const buildCsv = (results: BatchProofSuccess[]) => {
  const header = "input,resolved_address,proof_hash,score,tags,policy_version";
  const rows = results.map((result) => {
    const columns = [
      result.input,
      result.resolvedAddress,
      result.proofHash,
      result.score,
      result.tags.join("|"),
      POLICY_VERSION
    ];
    return columns.map(escapeCsvValue).join(",");
  });

  return [header, ...rows].join("\n");
};

const buildJson = (results: BatchProofSuccess[]) => {
  const payload = {
    policy_version: POLICY_VERSION,
    deterministic: true,
    generated_at: new Date().toISOString(),
    results: results.map((result) => ({
      input: result.input,
      resolved_address: result.resolvedAddress,
      proof_hash: result.proofHash,
      score: result.score,
      tags: result.tags
    }))
  };

  return JSON.stringify(payload, null, 2);
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
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyPolicyVersion, setVerifyPolicyVersion] = useState(POLICY_VERSION);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    proofHash: string;
    resolvedAddress: string;
    matchStatus: "match" | "mismatch" | "unverified";
  } | null>(null);
  const [verifyReferenceHash, setVerifyReferenceHash] = useState<string | null>(null);
  const [verifyReferenceInput, setVerifyReferenceInput] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const successfulResults = data?.results.filter(isBatchProofSuccess) ?? [];
  const errorCount = data?.results.filter((result) => "error" in result).length ?? 0;
  const showPartialSummary = successfulResults.length > 0 && errorCount > 0;

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

  const handleDownloadJson = () => {
    if (successfulResults.length === 0) {
      return;
    }

    const json = buildJson(successfulResults);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ens-proof-of-usage.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifyError(null);
    setVerifyResult(null);

    if (!apiBaseUrl) {
      setVerifyError("NEXT_PUBLIC_API_BASE_URL is not configured.");
      return;
    }

    const trimmedInput = verifyInput.trim();
    if (!trimmedInput) {
      setVerifyError("Enter a wallet address to verify.");
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/proof/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: [trimmedInput] })
      });
      const payload = (await response.json()) as BatchProofResponse | { error?: { message?: string } };

      if (!response.ok) {
        const message = "error" in payload && payload.error?.message
          ? payload.error.message
          : "Failed to verify proof.";
        throw new Error(message);
      }

      const result = (payload as BatchProofResponse).results[0];
      if (!result || "error" in result) {
        throw new Error(result && "error" in result ? result.error.message : "No proof returned.");
      }

      const matchStatus = verifyReferenceHash
        ? result.proofHash === verifyReferenceHash
          ? "match"
          : "mismatch"
        : "unverified";

      setVerifyResult({
        proofHash: result.proofHash,
        resolvedAddress: result.resolvedAddress,
        matchStatus
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setVerifyError(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUseForVerification = (result: BatchProofSuccess) => {
    setVerifyInput(result.resolvedAddress);
    setVerifyReferenceHash(result.proofHash);
    setVerifyReferenceInput(result.input);
    setVerifyResult(null);
    setVerifyError(null);
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
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={loading || successfulResults.length === 0}
            >
              Download JSON
            </button>
          </div>
          <p className="subtle csv-helper">
            Exports are deterministic and reproducible for the same policy version.
          </p>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <section className="section">
        <div className="card verify-card">
          <div className="card-title">
            <h2>Verify Proof</h2>
            <span className="badge-inline badge-soft">Deterministic</span>
          </div>
          <p className="subtle">
            Verification recomputes the proof using the same deterministic logic. No state is
            stored.
          </p>
          <form className="verify-form" onSubmit={handleVerify}>
            <div className="verify-grid">
              <label className="verify-field">
                <span className="verify-label">Wallet Address</span>
                <input
                  value={verifyInput}
                  onChange={(event) => setVerifyInput(event.target.value)}
                  placeholder="0x..."
                  aria-label="Wallet address"
                />
              </label>
              <label className="verify-field">
                <span className="verify-label">Policy Version</span>
                <select
                  value={verifyPolicyVersion}
                  onChange={(event) => setVerifyPolicyVersion(event.target.value)}
                  aria-label="Policy version"
                >
                  <option value={POLICY_VERSION}>{POLICY_VERSION}</option>
                </select>
              </label>
            </div>
            <div className="verify-actions">
              <button type="submit" disabled={verifyLoading}>
                {verifyLoading ? "Recomputing proof..." : "Verify Proof"}
              </button>
              {verifyReferenceHash ? (
                <span className="subtle verify-reference">
                  Reference hash loaded from {verifyReferenceInput ?? "a proof result"}.
                </span>
              ) : (
                <span className="subtle verify-reference">
                  Load a reference hash from a proof result to compare.
                </span>
              )}
            </div>
          </form>
          {verifyError ? <p className="error">{verifyError}</p> : null}
          {verifyResult ? (
            <div className="verify-output">
              <div className="verify-output-item">
                <div className="output-key">Computed Proof Hash</div>
                <div className="output-value mono copyable">{verifyResult.proofHash}</div>
              </div>
              <div className="verify-output-item">
                <div className="output-key">Match Status</div>
                <span
                  className={`match-pill match-${verifyResult.matchStatus}`}
                >
                  {verifyResult.matchStatus === "match"
                    ? "Match"
                    : verifyResult.matchStatus === "mismatch"
                      ? "Mismatch"
                      : "No reference hash"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {data ? (
        <div className="section">
          {showPartialSummary ? (
            <div className="summary-bar">
              <div className="summary-title">Partial results</div>
              <p className="summary-body">
                Some ENS names could not be resolved due to RPC rate limits. Successful proofs
                remain deterministic and reproducible.
              </p>
            </div>
          ) : null}
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
                      {isEns ? (
                        <a
                          className="identity-link"
                          href={getEnsProfileUrl(inputValue)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View ENS Profile
                        </a>
                      ) : null}
                    </div>
                    <span className="badge-inline">
                      {isEns ? "Identity-based (ENS)" : "Address-based"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="subtle">
              ENS improves identity usability. Proof inputs remain address-based.
            </p>
          </div>
          {data.results.map((result, index) => {
            if ("error" in result) {
              const normalizedError = normalizeBatchError(result.error);
              return (
                <div key={`${result.input}-${index}`} className="card card-error">
                  <div className="card-title">
                    <h2>Input: {result.input || "Invalid input"}</h2>
                    <span className="badge-inline badge-failed">Failed</span>
                  </div>
                  <div className="error-content">
                    <div className="error-title">{normalizedError.title}</div>
                    <p className="error-message">{normalizedError.message}</p>
                    <details className="error-details">
                      <summary>Details</summary>
                      <span className="error-code">Code: {normalizedError.detailsCode}</span>
                    </details>
                  </div>
                </div>
              );
            }

            return (
              <div key={`${result.input}-${index}`} className="card">
                <div className="card-title">
                  <div className="card-title-main">
                    <h2>Input: {result.input}</h2>
                  </div>
                  <div className="card-actions">
                    <span className="badge-inline badge-soft">Deterministic ✓</span>
                    {isEnsLikeInput(result.input) ? (
                      <a
                        className="btn-tertiary"
                        href={getEnsProfileUrl(result.input)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open ENS Profile
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="btn-tertiary"
                      onClick={() => handleUseForVerification(result)}
                    >
                      Use for Verification
                    </button>
                  </div>
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
                  <div className="output-block">
                    <div className="output-key">Resolved Address</div>
                    <div className="output-value mono copyable">{result.resolvedAddress}</div>
                  </div>
                  <div className="output-block">
                    <div className="output-key">Proof Hash</div>
                    <div className="output-value mono copyable">{result.proofHash}</div>
                    <div className="output-note">Deterministic proof identifier</div>
                  </div>
                  <div className="output-block score-block">
                    <div className="output-key">Score</div>
                    <div className="output-value score-value">{result.score}</div>
                  </div>
                </div>
                <div className="metadata-section">
                  <div className="metadata-title">Proof Metadata</div>
                  <div className="metadata-grid">
                    <div className="metadata-item">
                      <div className="metadata-label">Policy Version</div>
                      <div className="metadata-value">{POLICY_VERSION}</div>
                    </div>
                    <div className="metadata-item">
                      <div className="metadata-label">Proof Input</div>
                      <div className="metadata-value">Resolved wallet address</div>
                    </div>
                    <div className="metadata-item">
                      <div className="metadata-label">Reproducibility</div>
                      <div className="metadata-value">Deterministic</div>
                    </div>
                    <div className="metadata-item">
                      <div className="metadata-label">Deterministic</div>
                      <div className="metadata-value">
                        {result.deterministic ? "true" : "false"}
                      </div>
                    </div>
                  </div>
                  <p className="metadata-note">
                    This proof can always be reproduced using the same input and policy version.
                  </p>
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
