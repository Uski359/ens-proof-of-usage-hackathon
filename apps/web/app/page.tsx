export default function Home() {
  return (
    <main>
      <section className="hero hero-split">
        <div className="hero-main">
          <h1>ENS-aware Deterministic Proofs for DeFi Incentives</h1>
          <p className="lead">
            Reproducible eligibility proofs using ENS for identity abstraction without
            compromising determinism.
          </p>
          <ul className="bullet-list">
            <li>Deterministic and reproducible proofs</li>
            <li>ENS used strictly for UX and identity abstraction</li>
            <li>Designed for DeFi incentives, airdrops, and eligibility checks</li>
          </ul>
          <div className="cta-row">
            <a className="btn-primary" href="/demo/proof">
              Try the Proof Demo
            </a>
            <span className="cta-note">No wallet connection required</span>
          </div>
        </div>
        <div className="card hero-panel">
          <div className="hero-panel-title">Deterministic Output Snapshot</div>
          <div className="hero-panel-grid">
            <div className="hero-panel-item">
              <div className="hero-panel-label">Input</div>
              <div className="hero-panel-value">ENS name or 0x address</div>
            </div>
            <div className="hero-panel-item">
              <div className="hero-panel-label">Proof Input</div>
              <div className="hero-panel-value">Resolved wallet address</div>
            </div>
            <div className="hero-panel-item">
              <div className="hero-panel-label">Output</div>
              <div className="hero-panel-value">Hash, score, and policy signals</div>
            </div>
          </div>
          <p className="hero-panel-note">
            Designed for reproducible eligibility checks and policy readiness.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="card">
          <h2>Implementation Focus</h2>
          <p className="subtle">
            This demo intentionally focuses on the deterministic core to keep proofs
            reproducible and policy-ready. Advanced features are an intentional limitation
            in the current implementation.
          </p>
        </div>
      </section>
    </main>
  );
}
