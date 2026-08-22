import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useParams } from "react-router-dom";
import type { Provider } from "../../shared/schemas";
import { StatusBadge } from "../components/status-badge";
import { useRoomSocket } from "../lib/use-room-socket";

export function AdminPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const room = useRoomSocket(roomCode, "admin");
  const joinUrl = useMemo(() => `${window.location.origin}/join/${roomCode}`, [roomCode]);
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
            <h2>Prepared and reversible.</h2>
            <button className="button button-primary button-block" onClick={room.inject}>Inject guaranteed radio memory</button>
            <button className="button button-danger button-block" onClick={room.reset}>Reset room</button>
            <p>Reset removes the current ephemeral room state for all connected tabs.</p>
          </article>

          <article className="admin-section provider-section">
            <span className="mono-label">INFERENCE MODE</span>
            <h2>One contract. Three honest modes.</h2>
            <div className="provider-options">
              {(["mock", "gemma-api", "ollama"] as Provider[]).map((provider) => (
                <button
                  key={provider}
                  className={room.snapshot?.provider === provider ? "is-selected" : ""}
                  aria-pressed={room.snapshot?.provider === provider}
                  onClick={() => room.selectProvider(provider)}
                >
                  <strong>{provider === "gemma-api" ? "Cloud" : provider === "ollama" ? "Local" : "Mock"}</strong>
                  <span>{room.snapshot?.provider === provider ? "Active in this process" : "Restart the server in this mode"}</span>
                </button>
              ))}
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
