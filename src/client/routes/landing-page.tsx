import { Link } from "react-router-dom";
import windowsArtwork from "../../../assets/generated/submission-thumbnail.jpg";

export function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <span className="wordmark">87K WINDOWS</span>
        <span className="mono-label">A LIVING WALL OF MEMORIES</span>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">Ask before it is too late</p>
        <h1>Every life is a window.</h1>
        <p className="landing-thesis">Gemma helps us ask, listen, and see which windows are connected.</p>
        <p className="landing-copy">
          One humane question becomes one warm light. When two memories share a deeper human thread, the wall makes that connection visible.
        </p>
        <div className="landing-actions">
          <Link className="button button-primary" to="/join/demo87">Start the demo</Link>
          <Link className="text-link" to="/wall/demo87">Open Wall Mode</Link>
        </div>
      </section>
      <figure className="landing-visual">
        <img
          src={windowsArtwork}
          alt="Two illuminated windows connected across a Singapore housing block at night"
        />
        <figcaption>
          <strong>Two windows. One human thread.</strong>
          <span>Fictional generated artwork</span>
        </figcaption>
      </figure>
      <aside className="landing-proof" aria-label="How the demo works">
        <div><span>ASK</span><p>One small question, asked with patience.</p></div>
        <div><span>LISTEN</span><p>Your words stay separate from Gemma’s reading.</p></div>
        <div><span>CONNECT</span><p>Two lights glow only when the evidence holds.</p></div>
      </aside>
    </main>
  );
}
