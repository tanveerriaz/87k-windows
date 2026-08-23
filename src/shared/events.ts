import type {
  KopiCard,
  ConsentDecision,
  LitWindow,
  MatchResult,
  Provider,
  RoomSnapshot,
  SeniorBridge,
  StoryCapsule,
} from "./schemas";

export type ClientRole = "join" | "wall" | "admin";

export type RoomJoinPayload = {
  roomCode: string;
  role: ClientRole;
  adminSecret?: string;
};

export type EventAck = {
  ok: boolean;
  message?: string;
};

export type RoomJoinAck = { ok: true; snapshot: RoomSnapshot } | { ok: false; message: string };

export interface ServerToClientEvents {
  "room:snapshot": (snapshot: RoomSnapshot) => void;
  "story:submitted": (payload: { participantId: string }) => void;
  "capsule:ready": (payload: { participantId: string; capsule: StoryCapsule }) => void;
  "capsule:approved": (payload: { participantId: string }) => void;
  "window:lit": (window: LitWindow) => void;
  "match:started": (payload: { participantId: string }) => void;
  "match:found": (result: MatchResult) => void;
  "match:none": (result: MatchResult) => void;
  "consent:requested": (payload: { sourceParticipantId: string; candidateParticipantId: string; match: MatchResult }) => void;
  "consent:updated": (payload: RoomSnapshot["connectionConsent"]) => void;
  "bridge:animate": (result: MatchResult) => void;
  "invite:ready": (card: KopiCard) => void;
  "guide:ready": (guide: SeniorBridge) => void;
  "demo:reset": (snapshot: RoomSnapshot) => void;
  "provider:changed": (payload: {
    provider: Provider;
    requested: Provider;
    available: boolean;
    message: string;
  }) => void;
  "room:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: RoomJoinPayload, ack: (result: RoomJoinAck) => void) => void;
  "story:submitted": (payload: { roomCode: string; participantId: string }, ack?: (result: EventAck) => void) => void;
  "capsule:approved": (
    payload: { roomCode: string; participantId: string; capsule: StoryCapsule },
    ack?: (result: EventAck) => void,
  ) => void;
  "consent:decided": (
    payload: { roomCode: string; participantId: string; decision: Exclude<ConsentDecision, "pending"> },
    ack?: (result: EventAck) => void,
  ) => void;
  "demo:reset": (payload: { roomCode: string }, ack?: (result: EventAck) => void) => void;
  "demo:inject": (payload: { roomCode: string }, ack?: (result: EventAck) => void) => void;
  "provider:changed": (
    payload: { roomCode: string; provider: Provider },
    ack?: (result: EventAck) => void,
  ) => void;
}

export type InterServerEvents = Record<never, never>;

export interface SocketData {
  roomCode?: string;
  role?: ClientRole;
}
