import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientRole, ClientToServerEvents, ServerToClientEvents } from "../../shared/events";
import type { ConsentDecision, RoomSnapshot } from "../../shared/schemas";

type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const ACK_TIMEOUT_MS = 8_000;
const ACK_TIMEOUT_MESSAGE = "The room did not respond. Check the connection and try again.";

export function useRoomSocket(roomCode: string, role: ClientRole, adminSecret?: string) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socket = useMemo<RoomSocket>(() => io({ autoConnect: false, transports: ["websocket", "polling"] }), []);

  useEffect(() => {
    const joinRoom = () => {
      setConnected(true);
      setConnectionError(null);
      setMessage(null);
      socket.emit("room:join", { roomCode, role, adminSecret }, (result) => {
        if (result.ok) setSnapshot(result.snapshot);
        else setMessage(result.message);
      });
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error: Error) => setConnectionError(error.message || "Could not connect to the room.");
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
          if (err) return reject(new Error(ACK_TIMEOUT_MESSAGE));
          if (result.ok) return resolve();
          reject(new Error(result.message ?? "The safe capsule could not be approved."));
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
          if (err) return reject(new Error(ACK_TIMEOUT_MESSAGE));
          if (result.ok) return resolve();
          reject(new Error(result.message ?? "Your choice could not be recorded."));
        });
      }),
    [roomCode, socket],
  );

  const inject = useCallback(
    () => socket.emit("demo:inject", { roomCode }),
    [roomCode, socket],
  );

  return { snapshot, connected, connectionError, message, setMessage, submitted, approve, decide, reset, inject };
}
