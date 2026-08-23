import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientRole, ClientToServerEvents, ServerToClientEvents } from "../../shared/events";
import type { ConsentDecision, RoomSnapshot, StoryCapsule } from "../../shared/schemas";

type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useRoomSocket(roomCode: string, role: ClientRole, adminSecret?: string) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const socket = useMemo<RoomSocket>(() => io({ autoConnect: false, transports: ["websocket", "polling"] }), []);

  useEffect(() => {
    const joinRoom = () => {
      setConnected(true);
      setMessage(null);
      socket.emit("room:join", { roomCode, role, adminSecret }, (result) => {
        if (result.ok) setSnapshot(result.snapshot);
        else setMessage(result.message);
      });
    };
    const onDisconnect = () => setConnected(false);
    const onSnapshot = (current: RoomSnapshot) => setSnapshot(current);
    const onError = (payload: { message: string }) => setMessage(payload.message);
    const onProvider = (payload: { message: string }) => setMessage(payload.message);

    socket.on("connect", joinRoom);
    socket.on("disconnect", onDisconnect);
    socket.on("room:snapshot", onSnapshot);
    socket.on("room:error", onError);
    socket.on("provider:changed", onProvider);
    socket.connect();

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", onDisconnect);
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
    (participantId: string, capsule: StoryCapsule) =>
      new Promise<void>((resolve, reject) => {
        socket.emit("capsule:approved", { roomCode, participantId, capsule }, (result) => {
          if (result.ok) resolve();
          else reject(new Error(result.message ?? "The safe capsule could not be approved."));
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
        socket.emit("consent:decided", { roomCode, participantId, decision }, (result) => {
          if (result.ok) resolve();
          else reject(new Error(result.message ?? "Your choice could not be recorded."));
        });
      }),
    [roomCode, socket],
  );

  const inject = useCallback(
    () => socket.emit("demo:inject", { roomCode }),
    [roomCode, socket],
  );

  return { snapshot, connected, message, setMessage, submitted, approve, decide, reset, inject };
}
