import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main className="landing-page two-chairs-page">
      <nav className="landing-nav">
        <span className="wordmark">87K WINDOWS</span>
        <span className="mono-label">A SAFE PLACE TO BEGIN</span>
      </nav>
      <section className="two-chairs-hero">
        <div className="two-chairs-intro">
          <p className="eyebrow">A story needs a willing listener</p>
          <h1>What story should not disappear?</h1>
        </div>
        <figure className="two-chairs-visual">
          <img src="/assets/two-chairs-hero.png" alt="Two empty chairs facing a small lamp in a quiet community room" />
          <figcaption><span>ONE PERSON READY TO SPEAK</span><i aria-hidden="true" /><span>ONE PERSON READY TO LISTEN</span></figcaption>
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
        <span>GEMMA PROTECTS THE STORY</span>
        <span>GEMINI HELPS THE FIRST MINUTE</span>
        <Link to="/wall/demo87">View the living wall</Link>
      </footer>
    </main>
  );
}
