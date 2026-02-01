export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>ENS-aware Proof-of-Usage</h1>
        <p className="lead">
          Deterministic eligibility proofs for DeFi incentives using ENS for UX.
        </p>
        <ul className="bullet-list">
          <li>ENS is used only for UX and identity abstraction</li>
          <li>Proofs are generated only from the resolved wallet address</li>
          <li>Same input always produces the same proof (deterministic)</li>
          <li>AI is not part of the proof logic</li>
        </ul>
        <div className="cta-row">
          <a className="btn-primary" href="/demo/proof">
            Open Demo
          </a>
          <a
            className="link-secondary"
            href="https://github.com/<owner>/<repo>/blob/main/HACKATHON.md"
            target="_blank"
            rel="noreferrer"
          >
            Hackathon Notes
          </a>
        </div>
      </section>
      <section className="section">
        <div className="card">
          <h2>Check-in 1 Scope</h2>
          <p className="subtle">
            This demo intentionally focuses on the deterministic core.
            <br />
            Advanced features are planned for Check-in 2.
          </p>
        </div>
      </section>
    </main>
  );
}
