import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useParams } from "react-router-dom";
import { StatusBadge } from "../components/status-badge";
import { useRoomSocket } from "../lib/use-room-socket";

export function AdminPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const room = useRoomSocket(roomCode, "admin");
  const joinUrl = useMemo(() => `${window.location.origin}/join/${roomCode}`, [roomCode]);
  const activeProvider = room.snapshot?.provider;
  const isHostedGemma = activeProvider === "gemma-api";
  const isLocalGemma = activeProvider === "ollama";
  const isRealGemma = isHostedGemma || isLocalGemma;
  const activeProviderLabel = isHostedGemma
    ? "Hosted Gemma 4 via Gemini API"
    : activeProvider === "ollama"
      ? "Local Gemma 3 through Ollama"
      : activeProvider === "mock"
        ? "Development test harness"
        : "Connecting to inference";
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, { width: 360, margin: 2, color: { dark: "#090909", light: "#f4f4f0" } }).then(setQrData);
  }, [joinUrl]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="admin-page">
      <header className="mode-header admin-header">
        <div>
          <span className="wordmark">87K WINDOWS</span>
          <span className="room-label">PRESENTER · {roomCode.toUpperCase()}</span>
        </div>
        <StatusBadge connected={room.connected} provider={room.snapshot?.provider} />
      </header>
      <section className="admin-shell">
        <div className="admin-intro">
          <p className="eyebrow">Admin Mode</p>
          <h1>Keep the room moving.</h1>
          <p>Only safe room state appears here. API keys and raw memories never do.</p>
        </div>
        <div className="admin-grid">
          <article className="admin-section qr-section">
            <div>
              <span className="mono-label">JOIN THIS ROOM</span>
              <h2>One scan. No install.</h2>
              <p>{joinUrl}</p>
              <button className="button button-secondary" onClick={() => void copyUrl()}>{copied ? "Copied" : "Copy join URL"}</button>
            </div>
            {qrData && <img src={qrData} alt={`QR code for ${joinUrl}`} />}
          </article>

          <article className="admin-section control-section">
            <span className="mono-label">DEMO CONTROLS</span>
            <h2>Real inference. Prepared words.</h2>
            <button className="button button-primary button-block" onClick={room.inject}>
              {isRealGemma ? "Run prepared story through Gemma" : "Run prepared story"}
            </button>
            <button className="button button-danger button-block" onClick={room.reset}>Reset room</button>
            <p>The prepared story is fictional, but it goes through the active model. Reset removes the ephemeral room state.</p>
          </article>

          <article className="admin-section provider-section">
            <span className="mono-label">JUDGING INFERENCE</span>
            <h2>{isLocalGemma ? "Open Gemma is running privately." : isHostedGemma ? "Hosted Gemma is ready for online review." : activeProviderLabel}</h2>
            <div className={`provider-lock ${isRealGemma ? "is-live" : ""}`}>
              <span className="status-dot is-online" aria-hidden="true" />
              <div>
                <strong>{activeProviderLabel}</strong>
                <p>
                  {isHostedGemma
                    ? "Online review uses real hosted Gemma. It never falls back to simulated inference."
                    : activeProvider === "ollama"
                      ? "Primary live judging mode: memories are interpreted by open Gemma on this Mac and do not leave the local network."
                      : "Test harness active. This mode is for development and automated checks, never judging."}
                </p>
              </div>
            </div>
            {(room.message || room.snapshot?.lastError) && <div className="admin-message" role="status">{room.message ?? room.snapshot?.lastError}</div>}
          </article>

          <article className="admin-section room-state-section">
            <span className="mono-label">ROOM SNAPSHOT</span>
            <dl>
              <div><dt>Connection</dt><dd>{room.connected ? "Live" : "Reconnecting"}</dd></div>
              <div><dt>Phase</dt><dd>{room.snapshot?.phase ?? "Joining"}</dd></div>
              <div><dt>Windows lit</dt><dd>{room.snapshot?.windows.length ?? 0}</dd></div>
              <div><dt>Match</dt><dd>{room.snapshot?.match?.decision ?? "Not started"}</dd></div>
            </dl>
            <a className="text-link" href={`/wall/${roomCode}`} target="_blank" rel="noreferrer">Open Wall Mode ↗</a>
          </article>
        </div>
      </section>
    </main>
  );
}
