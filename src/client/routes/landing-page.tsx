import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-grid" aria-hidden="true" />
      <nav className="landing-nav">
        <span className="wordmark">87K WINDOWS</span>
        <span className="mono-label">SYNTHETIC DEMO · MOCK MODE</span>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">One memory. One human connection.</p>
        <h1>AI should not become her friend.</h1>
        <p className="landing-thesis">It should help her find one.</p>
        <p className="landing-copy">
          Share a fictional memory, approve the safe version, and watch an explainable bridge appear across the community wall.
        </p>
        <div className="landing-actions">
          <Link className="button button-primary" to="/join/demo87">Start the demo</Link>
          <Link className="text-link" to="/wall/demo87">Open Wall Mode</Link>
        </div>
      </section>
      <aside className="landing-proof" aria-label="How the demo works">
        <div><span>01</span><p>Share one synthetic memory.</p></div>
        <div><span>02</span><p>Review the safe capsule.</p></div>
        <div><span>03</span><p>See the evidence—or no match.</p></div>
      </aside>
    </main>
  );
}
