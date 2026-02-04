export default function Home() {
  return (
    <main>
      <section className="hero">
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
