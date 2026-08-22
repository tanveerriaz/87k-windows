import type { Facilitator, Provider } from "../../shared/schemas";

type StatusBadgeProps = {
  connected: boolean;
  provider?: Provider;
  facilitator?: Facilitator;
};

export function StatusBadge({ connected, provider, facilitator }: StatusBadgeProps) {
  const providerLabel = provider === "ollama" && facilitator === "gemini"
    ? "LOCAL GEMMA + GEMINI"
    : provider === "openrouter" && facilitator === "gemini"
      ? "GEMMA + GEMINI · OPENROUTER"
    : provider === "gemma-api" && facilitator === "gemini"
      ? "GEMMA + GEMINI · ONLINE"
      : provider === "ollama"
        ? "LOCAL GEMMA · ON-DEVICE"
    : provider === "gemma-api"
      ? "HOSTED GEMMA · ONLINE"
      : provider === "openrouter"
        ? "HOSTED GEMMA · OPENROUTER"
      : provider === "mock" && facilitator === "mock"
        ? "TEST HARNESS · DUAL MODEL"
        : provider === "mock"
        ? "TEST HARNESS"
        : "CONNECTING";
  return (
    <div className="status-badge" aria-label={`${providerLabel} provider, ${connected ? "connected" : "reconnecting"}`}>
      <span className={`status-dot ${connected ? "is-online" : ""}`} aria-hidden="true" />
      <span>{providerLabel}</span>
      <span className="status-divider" aria-hidden="true" />
      <span>{connected ? "LIVE ROOM" : "RECONNECTING"}</span>
    </div>
  );
}
