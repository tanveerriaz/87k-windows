import { Link } from "react-router-dom";
import { SiteWordmark } from "../components/site-wordmark";

export function LandingPage() {
  return (
    <main className="landing-page two-chairs-page">
      <nav className="landing-nav">
        <SiteWordmark />
        <span className="mono-label">A SAFE PLACE TO BEGIN</span>
      </nav>
      <div className="landing-facade-band" aria-hidden="true">
        <img
          className="landing-facade-still"
          src="/assets/landing-facade-still.jpg"
          alt=""
          width={1280}
          height={720}
          decoding="async"
        />
        <video
          className="landing-facade-video"
          src="/assets/landing-facade-ambient.mp4"
          poster="/assets/landing-facade-still.jpg"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <section className="two-chairs-hero">
        <div className="two-chairs-intro">
          <p className="eyebrow">A story needs a willing listener</p>
          <h1>What story should not disappear?</h1>
        </div>
        <figure className="two-chairs-visual">
          <video
            src="/landing-story.mp4?v=mix4"
            poster="/landing-story-poster.jpg"
            controls
            muted
            autoPlay
            playsInline
            preload="auto"
            aria-label="The story of 87K Windows: why the product is named for the roughly 87,000 seniors living alone in Singapore, told through a storyteller and a listener in the same block"
          />
        </figure>
        <div className="two-chairs-copy">
          <p className="landing-copy">87K Windows helps one person share a memory and another choose to listen. Gemma protects the story. Gemini helps the conversation begin, then steps away.</p>
          <div className="role-choices" aria-label="Choose how you want to take part">
            <Link className="role-choice role-choice-share" to="/join/demo87?role=share">
              <span>
                <strong>I have a story to share</strong>
                <small>Share your memories. Be heard.</small>
              </span>
            </Link>
            <Link className="role-choice role-choice-listen" to="/join/demo87?role=listen">
              <span>
                <strong>I would like to listen</strong>
                <small>Offer your time. Listen with care.</small>
              </span>
            </Link>
          </div>
          <p className="landing-assurance"><strong>No contact details are shared.</strong><br />Both people choose yes.</p>
        </div>
      </section>
      <footer className="two-chairs-footer">
        <div className="two-chairs-footer-meta">
          <span>GEMMA PROTECTS THE STORY</span>
          <span>GEMINI HELPS THE FIRST MINUTE</span>
          <span>MUSIC: “I GIORNI” · CLAVIER-MUSIC · PIXABAY</span>
          <Link to="/wall/demo87">View the living wall</Link>
        </div>
        <div className="site-credit">
          <p>
            Built by{" "}
            <a href="https://tanveerriaz.me/" rel="noopener noreferrer" target="_blank">
              Tanveer Riaz
            </a>
            {" "}during a hackathon — AI specialist and systems builder in Singapore.
          </p>
          <p className="site-credit-tagline">Curious mind. Builder mode! 🇸🇬</p>
          <p className="site-credit-links">
            <a href="https://tanveerriaz.me/" rel="noopener noreferrer" target="_blank">tanveerriaz.me</a>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/tanveerriaz/87k-windows" rel="noopener noreferrer" target="_blank">
              GitHub · 87k-windows
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
