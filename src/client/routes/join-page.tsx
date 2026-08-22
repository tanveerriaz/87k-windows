import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PREPARED_NO_MATCH_MEMORY, PREPARED_RADIO_MEMORY } from "../../shared/demo";
import type { StoryCapsule } from "../../shared/schemas";
import { StatusBadge } from "../components/status-badge";
import { extractCapsule } from "../lib/api";
import { compressImage } from "../lib/image";
import { useRoomSocket } from "../lib/use-room-socket";

const MEMORY_QUESTION = "What small thing made you happy when you were young?";
const JOURNEY_STEPS = ["You shared", "Gemma protected", "You approved", "A story matched"];

type Stage = "welcome" | "capture" | "processing" | "review" | "waiting" | "result";

export function JoinPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const participantId = useMemo(() => crypto.randomUUID(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("welcome");
  const [memory, setMemory] = useState(PREPARED_RADIO_MEMORY);
  const [fixture, setFixture] = useState<"radio" | "no-match">("radio");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoLabel, setPhotoLabel] = useState("Prepared fictional radio illustration");
  const [capsule, setCapsule] = useState<StoryCapsule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const room = useRoomSocket(roomCode, "join");
  const preparedImageSelected = fixture === "radio" && photoData === null;
  const journeySteps = room.snapshot?.phase === "no-match"
    ? [...JOURNEY_STEPS.slice(0, 3), "Still listening"]
    : room.snapshot?.guide
      ? [...JOURNEY_STEPS, "Gemini guides"]
      : JOURNEY_STEPS;
  const sourceStory = room.snapshot?.windows.findLast((window) => window.participantId === room.snapshot?.activeSourceId);
  const listenerStory = room.snapshot?.windows.findLast((window) => window.participantId === room.snapshot?.activeCandidateId);

  useEffect(() => {
    if (stage === "result" && room.snapshot?.activeSourceId !== participantId) {
      setError("This room has moved to another story. Your completed result is no longer active; review your memory and try again when the room is ready.");
      setStage("capture");
      return;
    }
    if (stage === "waiting" && (room.snapshot?.phase === "matched" || room.snapshot?.phase === "no-match")) {
      if (room.snapshot.activeSourceId === participantId) {
        setStage("result");
      } else {
        setError("Another participant shared after you. Your story was not matched; review it and try again when the room is ready.");
        setStage("capture");
      }
    }
  }, [participantId, room.snapshot?.activeSourceId, room.snapshot?.phase, stage]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const chooseFixture = (next: "radio" | "no-match") => {
    setFixture(next);
    setMemory(next === "radio" ? PREPARED_RADIO_MEMORY : PREPARED_NO_MATCH_MEMORY);
    setPhotoData(null);
    setPhotoLabel(next === "radio" ? "Prepared fictional radio illustration" : "Text-only no-match fixture");
    setCapsule(null);
    setError(null);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      setPhotoData(await compressImage(file));
      setPhotoLabel(`${file.name} · prepared in memory only`);
      setFixture("radio");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Use the prepared photo instead.");
    }
  };

  const restorePreparedImage = () => {
    chooseFixture("radio");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createCapsule = async () => {
    setStage("processing");
    setError(null);
    room.submitted(participantId);
    try {
      const result = await extractCapsule({ roomCode, memory, photoData: null, fixture });
      setCapsule(result);
      setStage("review");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nothing was shared. Please try again.");
      setStage("capture");
    }
  };

  const captureVoice = () => {
    type RecognitionResultEvent = Event & { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } };
    type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
    type RecognitionConstructor = new () => Recognition;
    const SpeechRecognition = (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice capture is not available in this browser. You can type your memory instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-SG";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0]?.transcript ?? "").join(" ").trim();
      if (transcript) setMemory(transcript);
    };
    recognition.onerror = () => setError("We could not hear that clearly. You can try again or type your memory.");
    recognition.onend = () => setIsListening(false);
    setError(null);
    setIsListening(true);
    recognition.start();
  };

  const approve = async () => {
    if (!capsule) return;
    setError(null);
    try {
      await room.approve(participantId, capsule);
      setStage("waiting");
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "The safe capsule was not shared.");
    }
  };

  const startAgain = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    room.reset();
    setCapsule(null);
    setStage("capture");
    chooseFixture("radio");
  };

  const speakGuide = () => {
    const guide = room.snapshot?.guide;
    if (!guide) return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setError("Read aloud is not available in this browser. The full guide remains on screen.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance([
      guide.introduction,
      ...guide.questions,
      guide.consentReminder,
    ].join(" "));
    utterance.lang = "en-SG";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setError(null);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopGuide = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <main className="join-page">
      <header className="mode-header">
        <div>
          <span className="wordmark">87K WINDOWS</span>
          <span className="room-label">ROOM {roomCode.toUpperCase()}</span>
        </div>
        <StatusBadge connected={room.connected} provider={room.snapshot?.provider} facilitator={room.snapshot?.facilitator} />
      </header>

      <section className="join-shell" aria-live="polite">
        <div className={`step-rail ${journeySteps.length === 5 ? "has-guide" : ""}`} aria-label="Progress">
          {journeySteps.map((label, index) => {
            const activeIndex = stage === "welcome" || stage === "capture"
              ? 0
              : stage === "processing" || stage === "review"
                ? 1
                : stage === "waiting"
                  ? 2
                  : 3;
            return <span key={label} className={index <= activeIndex ? "is-active" : ""}>{label}</span>;
          })}
        </div>

        {stage === "welcome" && (
          <div className="join-panel welcome-panel">
            <p className="eyebrow">Your words stay private until you choose to light a window</p>
            <h1>There is one question worth asking.</h1>
            <p>{MEMORY_QUESTION}</p>
            <p className="welcome-support">You can speak, type, or bring an old photo. First, you will see what Gemma noticed—and what remains only your words.</p>
            <button className="button button-primary button-block" onClick={() => setStage("capture")}>Share a prepared memory</button>
            <p className="privacy-note">Synthetic demo only · No account · Nothing stored</p>
          </div>
        )}

        {stage === "capture" && (
          <div className="join-panel capture-panel">
            <p className="eyebrow">One gentle question</p>
            <h1>{MEMORY_QUESTION}</h1>
            <p className="capture-intro">There is no right answer. A small detail is enough.</p>
            <div className="photo-preview">
              {photoData ? <img src={photoData} alt="Chosen preview; it has not been shared" /> : fixture === "radio" ? <img src="/demo-radio.svg" alt="Prepared fictional illustration of a radio and repair tools" /> : <div className="text-fixture">NO PHOTO<br />TEXT FIXTURE</div>}
              <span>{photoLabel}</span>
            </div>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <div className="capture-actions">
              <button className="button button-secondary" onClick={() => fileInputRef.current?.click()}>Add an old photo</button>
              {preparedImageSelected ? (
                <span className="prepared-image-status" role="status">Prepared demo image selected</span>
              ) : (
                <button className="text-button" onClick={restorePreparedImage}>Restore prepared demo image</button>
              )}
            </div>
            <p className="field-help">A photo is an optional memory cue. It stays in this browser and is never sent to Gemma. If camera access is denied, choose a file or keep the prepared illustration.</p>
            <label className="memory-field">
              <span>Your words</span>
              <textarea value={memory} maxLength={600} rows={4} placeholder="I remember…" onChange={(event) => setMemory(event.target.value)} />
              <small>{memory.length}/600</small>
            </label>
            <button className="voice-button" type="button" onClick={captureVoice} aria-pressed={isListening}>
              <span className="voice-ring" aria-hidden="true" />
              <span>{isListening ? "Listening… pause when you need to" : "Speak your memory"}</span>
              <small>Voice stays editable</small>
            </button>
            <button className="fixture-link" onClick={() => chooseFixture("no-match")}>Use no-match fixture</button>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" disabled={memory.trim().length < 8} onClick={() => void createCapsule()}>Create my safe capsule</button>
          </div>
        )}

        {stage === "processing" && (
          <div className="join-panel processing-panel">
            <div className="processing-window" aria-hidden="true"><span /><span /><span /><span /></div>
            <p className="eyebrow">Your words, then the meaning</p>
            <h1>Separating what you said from what may connect.</h1>
            <p>Gemma prepares a small, reviewable memory capsule. It does not fill in names, dates, or details you did not share.</p>
          </div>
        )}

        {stage === "review" && capsule && (
          <div className="join-panel review-panel">
            <p className="eyebrow">You remain the author</p>
            <h1>You decide what enters matching.</h1>
            <section className="words-card">
              <span className="mono-label">YOUR WORDS</span>
              <blockquote>“{memory}”</blockquote>
            </section>
            <section className="meaning-card">
              <span className="mono-label">WHAT GEMMA NOTICED</span>
              <p>{capsule.safeSummary}</p>
            </section>
            <div className="capsule-evidence">
              {capsule.place && <span><small>PLACE</small>{capsule.place}</span>}
              {capsule.era && <span><small>ERA</small>{capsule.era}</span>}
              {capsule.skills.map((skill) => <span key={skill}><small>SKILL</small>{skill}</span>)}
              {capsule.offers.map((offer) => <span key={offer}><small>OFFER</small>{offer}</span>)}
              {capsule.wants.map((want) => <span key={want}><small>WANTS</small>{want}</span>)}
            </div>
            {capsule.redactions.length > 0 ? (
              <div className="redaction-note"><strong>Removed before sharing</strong><p>{capsule.redactions.join(", ")}</p></div>
            ) : (
              <div className="redaction-note"><strong>No identifiers detected</strong><p>Only Gemma’s short interpretation and evidence above enter matching—not the full quote.</p></div>
            )}
            <details>
              <summary>What is uncertain?</summary>
              <ul>{capsule.uncertain.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" onClick={() => void approve()}>Approve and light my window</button>
            <button className="text-button button-block" onClick={() => setStage("capture")}>Go back and edit</button>
          </div>
        )}

        {stage === "waiting" && (
          <div className="join-panel waiting-panel">
            <div className="window-beacon" aria-hidden="true" />
            <p className="eyebrow">Your window is lit</p>
            <h1>Your story is now visible as a warm light.</h1>
            <p>Your approved capsule is being checked for a shared human thread. If the evidence holds, Gemini will prepare a gentle way to begin.</p>
          </div>
        )}

        {stage === "result" && room.snapshot?.phase === "matched" && room.snapshot.activeSourceId === participantId && room.snapshot.match && room.snapshot.invite && (
          <div className="join-panel result-panel">
            <p className="eyebrow">Your result</p>
            <h1>{room.snapshot.invite.title}</h1>
            <p className="result-summary">{room.snapshot.match.why}</p>
            <div className="story-pair">
              <article>
                <span className="mono-label">YOUR MEMORY</span>
                <p>{sourceStory?.safeSummary}</p>
              </article>
              <article>
                <span className="mono-label">PREPARED FICTIONAL INTEREST</span>
                <p>{listenerStory?.safeSummary}</p>
              </article>
            </div>
            <div className="evidence-path" aria-label="Evidence path">
              {room.snapshot.match.evidencePath.map((evidence) => <span key={evidence}>{evidence}</span>)}
            </div>
            {room.snapshot.guide && (
              <article className="senior-bridge">
                <span className="mono-label">GEMINI · SENIOR CONNECTION GUIDE</span>
                <h2>{room.snapshot.guide.introduction}</h2>
                <p className="bridge-intro">Two optional questions, written for a slower conversation:</p>
                <ol>
                  {room.snapshot.guide.questions.map((question) => <li key={question}>{question}</li>)}
                </ol>
                <p className="consent-reminder">{room.snapshot.guide.consentReminder}</p>
                <div className="read-aloud-actions">
                  <button className="button button-primary" type="button" aria-pressed={isSpeaking} onClick={speakGuide}>Read this aloud</button>
                  {isSpeaking && <button className="button button-secondary" type="button" onClick={stopGuide}>Stop reading</button>}
                </div>
                <small>Gemini received only the two approved safe capsules and the visible evidence above—not your raw words.</small>
              </article>
            )}
            {room.snapshot.guideError && <div className="error-banner" role="status">{room.snapshot.guideError}</div>}
            {error && <div className="error-banner" role="alert">{error}</div>}
            <article className="kopi-card">
              <span className="mono-label">SUGGESTED KOPI CARD · FICTIONAL DEMO</span>
              <h2>{room.snapshot.invite.invitation}</h2>
              <p>{room.snapshot.invite.activity}</p>
              <small>This prepared story has not accepted. In a real room, both people would choose whether to listen. No contact details are exchanged here.</small>
            </article>
            <button className="button button-secondary button-block" onClick={startAgain}>Run the demo again</button>
          </div>
        )}

        {stage === "result" && room.snapshot?.phase === "no-match" && room.snapshot.activeSourceId === participantId && (
          <div className="join-panel result-panel no-match-panel">
            <p className="eyebrow">Honest by design</p>
            <h1>NO MATCH YET</h1>
            <p className="no-match-human">We haven’t found the right listener yet.</p>
            <p>{room.snapshot.match?.why}</p>
            <div className="no-match-rule">No invitation was created, and your story remains safe.</div>
            <button className="button button-primary button-block" onClick={startAgain}>Try the prepared radio story</button>
          </div>
        )}
      </section>
    </main>
  );
}
