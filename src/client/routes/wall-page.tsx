import { useParams } from "react-router-dom";
import { HdbWallCanvas } from "../components/hdb-wall-canvas";
import { StatusBadge } from "../components/status-badge";
import { useRoomSocket } from "../lib/use-room-socket";

const RESULT_STEPS = ["You shared", "Gemma protected", "You approved", "A story matched"];

export function WallPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const room = useRoomSocket(roomCode, "wall");
  const snapshot = room.snapshot;
  const sourceStory = snapshot?.windows.findLast((window) => window.participantId === snapshot.activeSourceId);
  const listenerStory = snapshot?.windows.findLast((window) => window.participantId === snapshot.activeCandidateId);
  const resultSteps = snapshot?.guide ? [...RESULT_STEPS, "Gemini guides"] : RESULT_STEPS;
  const windowsLitCount = snapshot?.windows.length ?? 0;

  return (
    <main className="wall-page">
      <header className="wall-header">
        <div>
          <span className="wordmark">87K WINDOWS</span>
          <p>Lives witnessed. Human threads revealed.</p>
        </div>
        <div className="wall-room">
          <span>JOIN /join/{roomCode}</span>
          <StatusBadge connected={room.connected} provider={snapshot?.provider} facilitator={snapshot?.facilitator} />
        </div>
      </header>

      {(room.message || room.connectionError) && (
        <div className="error-banner" role="alert">
          <span>{room.message ?? room.connectionError}</span>
          {room.message && <button type="button" className="text-button" onClick={() => room.setMessage(null)}>Dismiss</button>}
        </div>
      )}

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
            <p>The approved capsule is being checked against visible evidence. If it holds, Gemini prepares a gentle way to begin.</p>
          </div>
        )}
        {snapshot?.phase === "matched" && snapshot.match && (
          <div className="wall-reveal">
            <div className="wall-result-main">
              <p className="eyebrow">This is what connected you</p>
              <h1>A potential listener match was found.</h1>
              <p className="wall-result-summary">{snapshot.match.why}</p>
              <div className="wall-journey" aria-label="How the connection was made" style={{ gridTemplateColumns: `repeat(${resultSteps.length}, 1fr)` }}>
                {resultSteps.map((step, index) => (
                  <span key={step}><small>0{index + 1}</small><strong>{step}</strong></span>
                ))}
              </div>
              <div className="wall-story-pair">
                <article>
                  <span className="mono-label">YOUR MEMORY</span>
                  <p>{sourceStory?.safeSummary}</p>
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
                  <span className="mono-label">PREPARED FICTIONAL INTEREST</span>
                  <p>{listenerStory?.safeSummary}</p>
                </article>
              </div>
            </div>
            {snapshot.guide ? (
              <article className="wall-invite wall-guide">
                <span className="mono-label">GEMINI · SENIOR CONNECTION GUIDE</span>
                <h2>{snapshot.guide.introduction}</h2>
                <ol>
                  {snapshot.guide.questions.map((question) => <li key={question}>{question}</li>)}
                </ol>
                <p className="wall-consent">{snapshot.guide.consentReminder}</p>
                <small>Gemini received only approved safe capsules. The people still choose whether to talk.</small>
              </article>
            ) : snapshot.guideError ? (
              <article className="wall-invite wall-guide-error">
                <span className="mono-label">GEMINI GUIDE UNAVAILABLE</span>
                <h2>The evidence-backed match remains valid.</h2>
                <p>{snapshot.guideError}</p>
              </article>
            ) : snapshot.invite && (
              <article className="wall-invite">
                <span className="mono-label">YOUR RESULT</span>
                <h2>Prepared fictional match</h2>
                <p>{snapshot.invite.invitation}</p>
                <p>{snapshot.invite.activity}</p>
                <small>This prepared story has not accepted. In a real room, both people would still choose whether to listen. No contact details are exchanged.</small>
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
        <span>{windowsLitCount === 1 ? "1 WINDOW LIT" : `${windowsLitCount} WINDOWS LIT`}</span>
        <span>GEMMA PROTECTS THE MEMORY. GEMINI HELPS PEOPLE BEGIN.</span>
      </footer>
    </main>
  );
}
