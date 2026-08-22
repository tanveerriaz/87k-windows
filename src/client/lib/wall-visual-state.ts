import type { RoomSnapshot } from "../../shared/schemas";

export type WallVisualState = {
  state: "idle" | "matching" | "matched" | "no-match";
  litWindowIds: number[];
  hasThread: boolean;
};

export function deriveWallVisualState(snapshot: RoomSnapshot | null): WallVisualState {
  if (!snapshot) return { state: "idle", litWindowIds: [], hasThread: false };

  const state = snapshot.phase === "matching" || snapshot.phase === "matched" || snapshot.phase === "no-match"
    ? snapshot.phase
    : "idle";
  const hasThread = state === "matched"
    && snapshot.match?.decision === "MATCH"
    && snapshot.match.scene !== null;

  return {
    state,
    litWindowIds: snapshot.windows.map((window) => window.windowId),
    hasThread,
  };
}
