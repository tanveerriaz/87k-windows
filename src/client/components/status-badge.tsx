type StatusBadgeProps = {
  connected: boolean;
  provider?: string;
};

export function StatusBadge({ connected, provider }: StatusBadgeProps) {
  const providerLabel = provider?.toUpperCase() ?? "CONNECTING";
  return (
    <div className="status-badge" aria-label={`${providerLabel} provider, ${connected ? "connected" : "reconnecting"}`}>
      <span className={`status-dot ${connected ? "is-online" : ""}`} aria-hidden="true" />
      <span>{providerLabel}</span>
      <span className="status-divider" aria-hidden="true" />
      <span>{connected ? "LIVE ROOM" : "RECONNECTING"}</span>
    </div>
  );
}
