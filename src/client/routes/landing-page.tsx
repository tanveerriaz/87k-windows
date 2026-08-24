import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteWordmark } from "../components/site-wordmark";
import { isLang, LANG_LABELS, t, type Lang } from "../lib/i18n";

const LANG_OPTIONS = Object.keys(LANG_LABELS) as Lang[];

export function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang] = useState<Lang>(() => {
    const requested = searchParams.get("lang");
    return requested && isLang(requested) ? requested : "en";
  });

  const changeLang = (next: Lang) => {
    setLang(next);
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      params.set("lang", next);
      return params;
    }, { replace: true });
  };

  const joinHref = (role: "share" | "listen") =>
    `/join/demo87?role=${role}${lang === "en" ? "" : `&lang=${lang}`}`;

  return (
    <main className="landing-page two-chairs-page">
      <nav className="landing-nav">
        <SiteWordmark />
        <span className="mono-label">{t(lang, "landingNavBadge")}</span>
        <label className="landing-lang-field">
          <span className="visually-hidden">{t(lang, "languageSelectorLabel")}</span>
          <select value={lang} onChange={(event) => changeLang(event.target.value as Lang)}>
            {LANG_OPTIONS.map((code) => <option key={code} value={code}>{LANG_LABELS[code]}</option>)}
          </select>
        </label>
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
          <p className="eyebrow">{t(lang, "landingEyebrow")}</p>
          <h1>{t(lang, "landingHeadline")}</h1>
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
            aria-label={t(lang, "landingVideoAriaLabel")}
          />
        </figure>
        <div className="two-chairs-copy">
          <p className="landing-copy">{t(lang, "landingCopy")}</p>
          <div className="role-choices" aria-label={t(lang, "landingRoleChoicesAriaLabel")}>
            <Link className="role-choice role-choice-share" to={joinHref("share")}>
              <span>
                <strong>{t(lang, "landingShareTitle")}</strong>
                <small>{t(lang, "landingShareSubtitle")}</small>
              </span>
            </Link>
            <Link className="role-choice role-choice-listen" to={joinHref("listen")}>
              <span>
                <strong>{t(lang, "roleSwitchWouldListen")}</strong>
                <small>{t(lang, "landingListenSubtitle")}</small>
              </span>
            </Link>
          </div>
          <p className="landing-assurance"><strong>{t(lang, "landingAssuranceContact")}</strong><br />{t(lang, "landingAssuranceConsent")}</p>
        </div>
      </section>
      <footer className="two-chairs-footer">
        <div className="two-chairs-footer-meta">
          <span>{t(lang, "landingFooterGemma")}</span>
          <span>{t(lang, "landingFooterGemini")}</span>
          <span>MUSIC: “I GIORNI” · CLAVIER-MUSIC · PIXABAY</span>
          <Link to="/wall/demo87">{t(lang, "landingViewWallLink")}</Link>
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
