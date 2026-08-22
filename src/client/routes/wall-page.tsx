import { useParams } from "react-router-dom";
import { HdbWallCanvas } from "../components/hdb-wall-canvas";
import { StatusBadge } from "../components/status-badge";
import { useRoomSocket } from "../lib/use-room-socket";

export function WallPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const room = useRoomSocket(roomCode, "wall");
  const snapshot = room.snapshot;

  return (
    <main className="wall-page">
      <header className="wall-header">
        <div>
          <span className="wordmark">87K WINDOWS</span>
          <p>Lives witnessed. Human threads revealed.</p>
        </div>
        <div className="wall-room">
          <span>JOIN /join/{roomCode}</span>
          <StatusBadge connected={room.connected} provider={snapshot?.provider} />
        </div>
      </header>
      <section className="wall-stage" aria-live="polite">
        <HdbWallCanvas snapshot={snapshot} />
        {(!snapshot || snapshot.phase === "idle" || snapshot.phase === "reviewing") && (
          <div className="wall-prompt">
            <span className="mono-label">ROOM {roomCode.toUpperCase()}</span>
            <h1>Scan. Share. Watch the wall light up.</h1>
            <p>Every dark window holds a life we have not taken the time to ask about. One question is waiting on your phone.</p>
          </div>
        )}
        {snapshot?.phase === "matching" && (
          <div className="wall-searching">
            <span className="mono-label">EVIDENCE SEARCH</span>
            <p>The approved capsule is being compared for a shared human thread—not just matching words.</p>
          </div>
        )}
        {snapshot?.phase === "matched" && snapshot.match && (
          <div className="wall-reveal">
            <div className="wall-result-main">
              <p className="eyebrow">This is what connected you</p>
              <h1>A neighbour would like to hear your story.</h1>
              <p className="wall-result-summary">{snapshot.match.why}</p>
              <div className="wall-story-pair">
                <article>
                  <span className="mono-label">YOUR MEMORY</span>
                  <p>{snapshot.windows[0]?.safeSummary}</p>
                </article>
                <div className="wall-evidence">
                  <span className="mono-label">EVIDENCE YOU BOTH SHARED</span>
                  <div className="evidence-path">
                    {snapshot.match.evidencePath.map((item, index) => (
                      <span key={item} style={{ animationDelay: `${index * 180}ms` }}>{item}</span>
                    ))}
                  </div>
                </div>
                <article>
                  <span className="mono-label">THEIR INTEREST</span>
                  <p>{snapshot.windows[1]?.safeSummary}</p>
                </article>
              </div>
            </div>
            {snapshot.invite && (
              <article className="wall-invite">
                <span className="mono-label">YOUR RESULT</span>
                <h2>{snapshot.invite.title}</h2>
                <p>{snapshot.invite.invitation}</p>
                <p>{snapshot.invite.activity}</p>
                <small>You approved this story for sharing. No contact details are exchanged.</small>
              </article>
            )}
          </div>
        )}
        {snapshot?.phase === "no-match" && (
          <div className="wall-no-match">
            <span className="mono-label">EVIDENCE CHECK COMPLETE</span>
            <h1>NO MATCH YET</h1>
            <h2>We haven’t found the right listener yet.</h2>
            <p>No invitation was created, and the approved story remains safe.</p>
          </div>
        )}
      </section>
      <footer className="wall-footer">
        <span>{snapshot?.windows.length ?? 0} WINDOWS LIT</span>
        <span>GEMMA MAKES MEMORY LEGIBLE. TRANSPARENT MATCHING DRAWS THE THREAD.</span>
      </footer>
    </main>
  );
}
