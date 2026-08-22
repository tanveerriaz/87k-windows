import type { RoomSnapshot } from "../../shared/schemas";

export type JoinStage =
  | "welcome"
  | "capture"
  | "processing"
  | "review"
  | "waiting"
  | "result"
  | "listen-profile"
  | "listen-invitation"
  | "listen-processing"
  | "listen-requested"
  | "consent"
  | "mutual-yes";

export type JoinDisplacement = {
  stage: JoinStage;
  error: string | null;
};

type JoinDisplacementInput = {
  stage: JoinStage;
  listenerEntry: boolean;
  participantId: string;
  snapshot: Pick<RoomSnapshot, "phase" | "activeSourceId" | "activeCandidateId" | "connectionConsent"> | null;
};

const ROOM_MOVED_ERROR = "This room has moved to another story. Your completed result is no longer active; review your memory and try again when the room is ready.";
const LISTENER_ROOM_MOVED_ERROR = "This room has moved to another story. When a new window is lit, you can offer to listen again.";
const DISPLACED_ERROR = "Another participant shared after you. Your story was not matched; review it and try again when the room is ready.";

export function resolveJoinDisplacement({
  stage,
  listenerEntry,
  participantId,
  snapshot,
}: JoinDisplacementInput): JoinDisplacement | null {
  if (!snapshot) return null;

  const inCurrentPair = snapshot.activeSourceId === participantId || snapshot.activeCandidateId === participantId;
  const honestNoMatch = snapshot.phase === "no-match" && !snapshot.connectionConsent;

  if (listenerEntry && stage === "listen-requested" && honestNoMatch) {
    return { stage: "result", error: null };
  }

  if (stage === "result" && !snapshot.connectionConsent && snapshot.activeSourceId !== participantId) {
    if (honestNoMatch && (inCurrentPair || listenerEntry)) return null;
    if (listenerEntry) return { stage: "listen-profile", error: LISTENER_ROOM_MOVED_ERROR };
    return { stage: "capture", error: ROOM_MOVED_ERROR };
  }

  if (stage === "waiting" && !snapshot.connectionConsent && (snapshot.phase === "matched" || snapshot.phase === "no-match")) {
    if (snapshot.activeSourceId === participantId || (honestNoMatch && snapshot.activeCandidateId === participantId)) {
      return { stage: "result", error: null };
    }
    return { stage: "capture", error: DISPLACED_ERROR };
  }

  return null;
}
