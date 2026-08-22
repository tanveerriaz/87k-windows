import type { Facilitator, Provider } from "../../shared/schemas";
import { publicStatusLabel } from "../lib/provider-presentation";

type StatusBadgeProps = {
  connected: boolean;
  provider?: Provider;
  facilitator?: Facilitator;
};

export function StatusBadge({ connected, provider, facilitator }: StatusBadgeProps) {
  const providerLabel = publicStatusLabel(provider, facilitator);
  return (
    <div className="status-badge" aria-label={`${providerLabel} provider, ${connected ? "connected" : "reconnecting"}`}>
      <span className={`status-dot ${connected ? "is-online" : ""}`} aria-hidden="true" />
      <span>{providerLabel}</span>
      <span className="status-divider" aria-hidden="true" />
      <span>{connected ? "LIVE ROOM" : "RECONNECTING"}</span>
    </div>
  );
}
