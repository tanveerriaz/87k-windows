type StatusBadgeProps = {
  connected: boolean;
  provider?: string;
};

export function StatusBadge({ connected, provider = "mock" }: StatusBadgeProps) {
  return (
    <div className="status-badge" aria-label={`${provider} provider, ${connected ? "connected" : "reconnecting"}`}>
      <span className={`status-dot ${connected ? "is-online" : ""}`} aria-hidden="true" />
      <span>{provider.toUpperCase()}</span>
      <span className="status-divider" aria-hidden="true" />
      <span>{connected ? "LIVE ROOM" : "RECONNECTING"}</span>
    </div>
  );
}
