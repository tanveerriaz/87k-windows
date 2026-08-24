import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientRole, ClientToServerEvents, ServerToClientEvents } from "../../shared/events";
import type { ConsentDecision, RoomSnapshot } from "../../shared/schemas";
import type { UiStringKey } from "./i18n";

type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const ACK_TIMEOUT_MS = 8_000;
const ACK_TIMEOUT_MESSAGE = "The room did not respond. Check the connection and try again.";
const APPROVAL_FAILED_MESSAGE = "The safe capsule could not be approved.";
const CHOICE_NOT_RECORDED_MESSAGE = "Your choice could not be recorded.";
const CONNECT_FAILED_MESSAGE = "Could not connect to the room.";

/**
 * Attaches a UiStringKey to a client-authored friendly Error so join-page.tsx
 * (the only consumer of `approve`/`decide`) can render it in the participant's
 * language. Server-supplied `result.message` text has no key and stays English.
 */
function friendlyError(message: string, key: UiStringKey): Error {
  return Object.assign(new Error(message), { key });
}

export function useRoomSocket(roomCode: string, role: ClientRole, adminSecret?: string) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  /** Set only when connectionError is the client-authored CONNECT_FAILED_MESSAGE fallback (not the socket's own technical error text), so join-page.tsx can translate it while wall/admin keep rendering connectionError as-is. */
  const [connectionErrorKey, setConnectionErrorKey] = useState<UiStringKey | null>(null);

  const socket = useMemo<RoomSocket>(() => io({ autoConnect: false, transports: ["websocket", "polling"] }), []);

  useEffect(() => {
    const joinRoom = () => {
      setConnected(true);
      setConnectionError(null);
      setConnectionErrorKey(null);
      setMessage(null);
      socket.emit("room:join", { roomCode, role, adminSecret }, (result) => {
        if (result.ok) setSnapshot(result.snapshot);
        else setMessage(result.message);
      });
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error: Error) => {
      if (error.message) {
        setConnectionError(error.message);
        setConnectionErrorKey(null);
      } else {
        setConnectionError(CONNECT_FAILED_MESSAGE);
        setConnectionErrorKey("errorConnectionFailed");
      }
    };
    const onSnapshot = (current: RoomSnapshot) => setSnapshot(current);
    const onError = (payload: { message: string }) => setMessage(payload.message);
    const onProvider = (payload: { message: string }) => setMessage(payload.message);

    socket.on("connect", joinRoom);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:snapshot", onSnapshot);
    socket.on("room:error", onError);
    socket.on("provider:changed", onProvider);
    socket.connect();

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:snapshot", onSnapshot);
      socket.off("room:error", onError);
      socket.off("provider:changed", onProvider);
      socket.disconnect();
    };
  }, [adminSecret, role, roomCode, socket]);

  const submitted = useCallback(
    (participantId: string) => socket.emit("story:submitted", { roomCode, participantId }),
    [roomCode, socket],
  );

  const approve = useCallback(
    (participantId: string, capsuleId: string) =>
      new Promise<void>((resolve, reject) => {
        socket.timeout(ACK_TIMEOUT_MS).emit("capsule:approved", { roomCode, participantId, capsuleId }, (err, result) => {
          if (err) return reject(friendlyError(ACK_TIMEOUT_MESSAGE, "errorRoomNoResponse"));
          if (result.ok) return resolve();
          reject(result.message ? new Error(result.message) : friendlyError(APPROVAL_FAILED_MESSAGE, "errorApprovalFailed"));
        });
      }),
    [roomCode, socket],
  );

  const reset = useCallback(
    () => socket.emit("demo:reset", { roomCode }),
    [roomCode, socket],
  );

  const decide = useCallback(
    (participantId: string, decision: Exclude<ConsentDecision, "pending">) =>
      new Promise<void>((resolve, reject) => {
        socket.timeout(ACK_TIMEOUT_MS).emit("consent:decided", { roomCode, participantId, decision }, (err, result) => {
          if (err) return reject(friendlyError(ACK_TIMEOUT_MESSAGE, "errorRoomNoResponse"));
          if (result.ok) return resolve();
          reject(result.message ? new Error(result.message) : friendlyError(CHOICE_NOT_RECORDED_MESSAGE, "errorChoiceNotRecorded"));
        });
      }),
    [roomCode, socket],
  );

  const inject = useCallback(
    () => socket.emit("demo:inject", { roomCode }),
    [roomCode, socket],
  );

  return { snapshot, connected, connectionError, connectionErrorKey, message, setMessage, submitted, approve, decide, reset, inject };
}
