import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import memoryObjects from "../../../assets/generated/memory-objects.jpg";
import { PREPARED_NO_MATCH_MEMORY, PREPARED_RADIO_MEMORY } from "../../shared/demo";
import type { StoryCapsule } from "../../shared/schemas";
import { SiteWordmark } from "../components/site-wordmark";
import { StatusBadge } from "../components/status-badge";
import { ApiError, extractCapsule } from "../lib/api";
import { compressImage } from "../lib/image";
import { isLang, LANG_LABELS, SPEECH_LOCALE, t, type Lang, type UiStringKey } from "../lib/i18n";
import { resolveJoinDisplacement, type JoinStage } from "../lib/join-stage";
import { useRoomSocket } from "../lib/use-room-socket";
import { pickVoice } from "../lib/voice-picker";

const JOURNEY_STEP_KEYS: UiStringKey[] = ["journeyYouShared", "journeyGemmaProtected", "journeyYouApproved", "journeyStoryMatched"];
const LANG_OPTIONS = Object.keys(LANG_LABELS) as Lang[];
// English descriptor for the pre-Task-4 (English-only) capsule pipeline text only — never render this to the participant, use LANG_LABELS for visible text.
const LANGUAGE_ENGLISH_NAME: Record<Lang, string> = { en: "English", zh: "Mandarin", ms: "Malay", ta: "Tamil" };

type ListenerTimeId = "short" | "quarter" | "visit";
const LISTENER_TIME_OPTIONS: ListenerTimeId[] = ["short", "quarter", "visit"];
const LISTENER_TIME_ENGLISH: Record<ListenerTimeId, string> = {
  short: "One short conversation this week",
  quarter: "15 minutes today",
  visit: "A visit at a partner centre",
};
const LISTENER_TIME_KEY: Record<ListenerTimeId, UiStringKey> = {
  short: "timeOptionShortConvo",
  quarter: "timeOption15Min",
  visit: "timeOptionVisit",
};

type PhotoLabelState =
  | { kind: "prepared-radio" }
  | { kind: "no-match-fixture" }
  | { kind: "uploaded"; fileName: string };

function photoLabelText(lang: Lang, state: PhotoLabelState): string {
  if (state.kind === "prepared-radio") return t(lang, "preparedRadioImageLabel");
  if (state.kind === "no-match-fixture") return t(lang, "noMatchFixtureImageLabel");
  return `${state.fileName} ${t(lang, "preparedInMemoryOnlySuffix")}`;
}

/**
 * Resolves a caught error to display text in the participant's language.
 * Prefers a `.key` attached by api.ts/use-room-socket.ts for client-authored
 * friendly errors; falls back to the raw `.message` for dynamic server-
 * supplied text (which stays English), then to a translated fallback key.
 */
function localizedErrorMessage(lang: Lang, error: unknown, fallbackKey: UiStringKey): string {
  if (error && typeof error === "object") {
    const key = (error as { key?: unknown }).key;
    if (typeof key === "string") return t(lang, key as UiStringKey);
  }
  if (error instanceof Error && error.message) return error.message;
  return t(lang, fallbackKey);
}

function speakText(text: string, locale: string, voice: SpeechSynthesisVoice | null, onEnd?: () => void): void {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  if (voice) utterance.voice = voice;
  utterance.rate = 0.82;
  utterance.pitch = 1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function JoinPage() {
  const roomCode = (useParams().roomCode ?? "demo87").toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();
  const listenerEntry = searchParams.get("role") === "listen";
  const lastRoleEntryRef = useRef(listenerEntry);
  const participantId = useMemo(() => crypto.randomUUID(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<JoinStage>(listenerEntry ? "listen-profile" : "welcome");
  const [memory, setMemory] = useState(PREPARED_RADIO_MEMORY);
  const [fixture, setFixture] = useState<"radio" | "no-match">("radio");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoLabel, setPhotoLabel] = useState<PhotoLabelState>({ kind: "prepared-radio" });
  const [capsule, setCapsule] = useState<StoryCapsule | null>(null);
  const [capsuleId, setCapsuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "decide" | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    const requested = searchParams.get("lang");
    return requested && isLang(requested) ? requested : "en";
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [listenerTime, setListenerTime] = useState<ListenerTimeId>("short");
  const [listenerReason, setListenerReason] = useState("I want to learn radio repair and hear what Queenstown was like in the 1970s.");
  const room = useRoomSocket(roomCode, "join");
  const preparedImageSelected = fixture === "radio" && photoData === null;
  const journeyStepKeys: UiStringKey[] = room.snapshot?.phase === "no-match"
    ? [...JOURNEY_STEP_KEYS.slice(0, 3), "journeyStillListening"]
    : room.snapshot?.guide
      ? [...JOURNEY_STEP_KEYS, "journeyGeminiGuides"]
      : JOURNEY_STEP_KEYS;
  const sourceStory = room.snapshot?.windows.findLast((window) => window.participantId === room.snapshot?.activeSourceId);
  const listenerStory = room.snapshot?.windows.findLast((window) => window.participantId === room.snapshot?.activeCandidateId);
  const consent = room.snapshot?.connectionConsent;
  const isConsentParticipant = consent?.sourceParticipantId === participantId || consent?.candidateParticipantId === participantId;
  const myConsentDecision = consent?.sourceParticipantId === participantId
    ? consent.sourceDecision
    : consent?.candidateParticipantId === participantId
      ? consent.candidateDecision
      : null;
  const ttsVoice = useMemo(() => pickVoice(availableVoices, SPEECH_LOCALE[lang]), [availableVoices, lang]);
  const canReadAloudNow = ttsVoice !== null;

  useEffect(() => {
    document.documentElement.lang = SPEECH_LOCALE[lang];
    return () => {
      document.documentElement.lang = SPEECH_LOCALE.en;
    };
  }, [lang]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (lastRoleEntryRef.current === listenerEntry) return;
    lastRoleEntryRef.current = listenerEntry;
    setStage(listenerEntry ? "listen-profile" : "welcome");
    setError(null);
  }, [listenerEntry]);

  useEffect(() => {
    const next = resolveJoinDisplacement({
      stage,
      listenerEntry,
      participantId,
      snapshot: room.snapshot,
    });
    if (!next) return;
    if (next.error) setError(t(lang, next.error));
    if (next.stage !== stage) setStage(next.stage);
  }, [lang, listenerEntry, participantId, room.snapshot, stage]);

  useEffect(() => {
    if (!isConsentParticipant || !consent) return;
    if (consent.mutualYes && room.snapshot?.phase === "matched") {
      setStage(listenerEntry ? "mutual-yes" : "result");
      return;
    }
    if (room.snapshot?.phase === "no-match") {
      setStage("result");
      return;
    }
    setStage(myConsentDecision === "yes" ? "listen-requested" : "consent");
  }, [consent, isConsentParticipant, listenerEntry, myConsentDecision, room.snapshot?.phase]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (stage !== "processing" && stage !== "listen-processing") {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(0);
    const interval = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [stage]);

  const changeLang = (next: Lang) => {
    setLang(next);
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      params.set("lang", next);
      return params;
    }, { replace: true });
  };

  const chooseFixture = (next: "radio" | "no-match") => {
    setFixture(next);
    setMemory(next === "radio" ? PREPARED_RADIO_MEMORY : PREPARED_NO_MATCH_MEMORY);
    setPhotoData(null);
    setPhotoLabel(next === "radio" ? { kind: "prepared-radio" } : { kind: "no-match-fixture" });
    setCapsule(null);
    setCapsuleId(null);
    setError(null);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      setPhotoData(await compressImage(file));
      setPhotoLabel({ kind: "uploaded", fileName: file.name });
      setFixture("radio");
    } catch (imageError) {
      setError(localizedErrorMessage(lang, imageError, "errorPhotoFallback"));
    }
  };

  const restorePreparedImage = () => {
    chooseFixture("radio");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createCapsule = async (isRetry = false) => {
    setStage("processing");
    setError(null);
    if (!isRetry) room.submitted(participantId);
    try {
      const result = await extractCapsule({ roomCode, memory, fixture, language: lang });
      setCapsule(result.capsule);
      setCapsuleId(result.capsuleId);
      setStage("review");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.code === "LOCAL_GEMMA_BUSY" && !isRetry) {
        setError(t(lang, "errorLocalModelBusy"));
        window.setTimeout(() => void createCapsule(true), 3_000);
        return;
      }
      setError(localizedErrorMessage(lang, requestError, "errorNothingShared"));
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
      setError(t(lang, "errorVoiceUnavailable"));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALE[lang];
    recognition.interimResults = false;
    recognition.continuous = false;
    let gotResult = false;
    let hadError = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0]?.transcript ?? "").join(" ").trim();
      if (transcript) {
        gotResult = true;
        setMemory(transcript);
      }
    };
    recognition.onerror = () => {
      hadError = true;
    };
    recognition.onend = () => {
      setIsListening(false);
      if (gotResult) return;
      if (lang !== "en") {
        setError(t(lang, "errorVoiceLanguageUnavailable"));
      } else if (hadError) {
        setError(t(lang, "errorVoiceNotClear"));
      }
    };
    setError(null);
    setIsListening(true);
    recognition.start();
  };

  const approve = async () => {
    if (!capsule || !capsuleId) return;
    setError(null);
    setPendingAction("approve");
    try {
      await room.approve(participantId, capsuleId);
      setStage("waiting");
    } catch (approvalError) {
      setError(localizedErrorMessage(lang, approvalError, "errorApprovalNotShared"));
    } finally {
      setPendingAction(null);
    }
  };

  const requestConversation = async () => {
    const listenerMemory = [
      `I can listen in ${LANGUAGE_ENGLISH_NAME[lang]}.`,
      `I can offer ${LISTENER_TIME_ENGLISH[listenerTime].toLowerCase()}.`,
      listenerReason.trim(),
    ].join(" ");
    setStage("listen-processing");
    setError(null);
    room.submitted(participantId);
    try {
      const listenerCapsule = await extractCapsule({ roomCode, memory: listenerMemory, language: lang });
      await room.approve(participantId, listenerCapsule.capsuleId);
      setCapsule(listenerCapsule.capsule);
      setCapsuleId(listenerCapsule.capsuleId);
      setStage("listen-requested");
    } catch (requestError) {
      setError(localizedErrorMessage(lang, requestError, "errorListeningRequestFailed"));
      setStage("listen-invitation");
    }
  };

  const decideConnection = async (decision: "yes" | "no") => {
    setError(null);
    setPendingAction("decide");
    try {
      await room.decide(participantId, decision);
      if (decision === "yes") setStage("listen-requested");
    } catch (decisionError) {
      setError(localizedErrorMessage(lang, decisionError, "errorChoiceNotRecorded"));
    } finally {
      setPendingAction(null);
    }
  };

  const startAgain = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setStage(listenerEntry ? "listen-profile" : "welcome");
    setCapsule(null);
    setCapsuleId(null);
    setError(null);
    setPendingAction(null);
    setMemory("");
  };

  const speakGuide = () => {
    const guide = room.snapshot?.guide;
    if (!guide) return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setError(t(lang, "errorReadAloudUnavailableGuide"));
      return;
    }
    setError(null);
    setIsSpeaking(true);
    speakText([guide.introduction, ...guide.questions, guide.consentReminder].join(" "), SPEECH_LOCALE[lang], ttsVoice, () => setIsSpeaking(false));
  };

  const readReviewAloud = () => {
    if (!capsule) return;
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setError(t(lang, "errorReadAloudUnavailableCapsule"));
      return;
    }
    const fieldLines: string[] = [];
    if (capsule.place) fieldLines.push(`Place: ${capsule.place}.`);
    if (capsule.era) fieldLines.push(`Era: ${capsule.era}.`);
    capsule.skills.forEach((skill) => fieldLines.push(`Skill: ${skill}.`));
    capsule.offers.forEach((offer) => fieldLines.push(`Offer: ${offer}.`));
    capsule.wants.forEach((want) => fieldLines.push(`Wants: ${want}.`));
    const uncertainLine = capsule.uncertain.length > 0 ? `Uncertain: ${capsule.uncertain.join(". ")}.` : "";
    const fullText = [capsule.safeSummary, ...fieldLines, uncertainLine].filter(Boolean).join(" ");
    setError(null);
    setIsSpeaking(true);
    speakText(fullText, SPEECH_LOCALE[lang], ttsVoice, () => setIsSpeaking(false));
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <main className="join-page">
      <header className="mode-header">
        <div>
          <SiteWordmark />
          <span className="room-label">{t(lang, "roomLabelPrefix")} {roomCode.toUpperCase()}</span>
        </div>
        <StatusBadge connected={room.connected} provider={room.snapshot?.provider} facilitator={room.snapshot?.facilitator} />
      </header>

      {(room.message || room.connectionError) && (
        <div className="error-banner" role="alert">
          <span>{room.message ?? (room.connectionErrorKey ? t(lang, room.connectionErrorKey) : room.connectionError)}</span>
          {room.message && <button type="button" className="text-button" onClick={() => room.setMessage(null)}>{t(lang, "dismissButton")}</button>}
        </div>
      )}

      <section className="join-shell" data-lang={lang} aria-live="polite">
        <div className={`step-rail ${journeyStepKeys.length === 5 ? "has-guide" : ""}`} aria-label={t(lang, "progressAriaLabel")}>
          {journeyStepKeys.map((stepKey, index) => {
            const activeIndex = stage === "welcome" || stage === "capture"
              ? 0
              : stage === "processing" || stage === "review"
                ? 1
                : stage === "waiting"
                  ? 2
                  : 3;
            return <span key={stepKey} className={index <= activeIndex ? "is-active" : ""}>{t(lang, stepKey)}</span>;
          })}
        </div>

        {listenerEntry && (stage === "listen-profile" || stage === "listen-invitation" || stage === "listen-processing" || stage === "listen-requested" || stage === "consent" || stage === "mutual-yes") && (
          <div className="role-switch"><Link to={`/join/${roomCode}?role=share`}>{t(lang, "roleSwitchHaveStory")}</Link><span aria-hidden="true">/</span><strong>{t(lang, "roleSwitchWouldListen")}</strong></div>
        )}

        {stage === "listen-profile" && (
          <div className="join-panel listener-panel">
            <p className="eyebrow">{t(lang, "listenProfileEyebrow")}</p>
            <h1>{t(lang, "listenProfileHeading")}</h1>
            <p className="listener-intro">{t(lang, "listenProfileIntro")}</p>
            <label className="listener-field"><span>{t(lang, "languageFieldLabel")}</span><select value={lang} onChange={(event) => changeLang(event.target.value as Lang)}>{LANG_OPTIONS.map((code) => <option key={code} value={code}>{LANG_LABELS[code]}</option>)}</select></label>
            <label className="listener-field"><span>{t(lang, "timeFieldLabel")}</span><select value={listenerTime} onChange={(event) => setListenerTime(event.target.value as ListenerTimeId)}>{LISTENER_TIME_OPTIONS.map((id) => <option key={id} value={id}>{t(lang, LISTENER_TIME_KEY[id])}</option>)}</select></label>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" onClick={() => setStage("listen-invitation")}>{t(lang, "seeInvitationButton")}</button>
            <p className="privacy-note">{t(lang, "listenerPrivacyNote")}</p>
          </div>
        )}

        {stage === "listen-invitation" && (
          <div className="join-panel listener-panel listener-invitation">
            <p className="eyebrow">{t(lang, "invitationEyebrow")}</p>
            <h1>{room.snapshot?.windows[0]?.safeSummary ?? t(lang, "invitationFallbackHeading")}</h1>
            <article className="safe-invitation-card">
              <img src={memoryObjects} alt={t(lang, "invitationImageAlt")} />
              <div><span className="mono-label">{t(lang, "whatTheyChoseLabel")}</span><p>{room.snapshot?.windows[0]?.safeSummary ?? t(lang, "invitationFallbackBody")}</p><small>{t(lang, "invitationDisclaimer")}</small></div>
            </article>
            <label className="memory-field"><span>{t(lang, "listenerReasonLabel")}</span><textarea value={listenerReason} maxLength={240} rows={4} onChange={(event) => setListenerReason(event.target.value)} /><small>{listenerReason.length}/240</small></label>
            <p className="listener-preference">{t(lang, "listenerOfferedPrefix")} <strong>{LANG_LABELS[lang]}</strong> · <strong>{t(lang, LISTENER_TIME_KEY[listenerTime])}</strong></p>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" disabled={listenerReason.trim().length < 12 || !room.snapshot?.windows[0]} onClick={() => void requestConversation()}>{t(lang, "prepareRequestButton")}</button>
            <button className="text-button button-block" onClick={() => setStage("listen-profile")}>{t(lang, "changeOfferButton")}</button>
          </div>
        )}

        {stage === "listen-processing" && (
          <div className="join-panel processing-panel">
            <p className="eyebrow">{t(lang, "listenProcessingEyebrow")}</p>
            <h1>{t(lang, "listenProcessingHeading")}</h1>
            <p>{t(lang, "listenProcessingBody")}</p>
            <p className="processing-elapsed">{elapsedSeconds}{t(lang, "elapsedSuffix")}</p>
          </div>
        )}

        {stage === "consent" && consent && isConsentParticipant && (
          <div className="join-panel listener-panel consent-state-panel">
            <p className="eyebrow">{t(lang, "consentEyebrow")}</p>
            <h1>{t(lang, "consentHeading")}</h1>
            <p>{room.snapshot?.match?.why}</p>
            <div className="story-pair">
              <article><span className="mono-label">{t(lang, "storytellerLabel")}</span><p>{sourceStory?.safeSummary}</p></article>
              <article><span className="mono-label">{t(lang, "listenerLabel")}</span><p>{listenerStory?.safeSummary}</p></article>
            </div>
            <p className="privacy-note">{t(lang, "consentPrivacyNote")}</p>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" disabled={pendingAction === "decide"} onClick={() => void decideConnection("yes")}>{pendingAction === "decide" ? t(lang, "consentPending") : t(lang, "consentYesButton")}</button>
            <button className="button button-secondary button-block" disabled={pendingAction === "decide"} onClick={() => void decideConnection("no")}>{pendingAction === "decide" ? t(lang, "consentPending") : t(lang, "consentNoButton")}</button>
          </div>
        )}

        {stage === "listen-requested" && (
          <div className="join-panel listener-panel consent-state-panel">
            <p className="eyebrow">{t(lang, "requestedEyebrow")}</p>
            <h1>{t(lang, "requestedHeading")}</h1>
            <p>{t(lang, "requestedBody")}</p>
            <div className="consent-ledger"><span>{t(lang, "yourChoiceLabel")}</span><strong>{myConsentDecision === "yes" ? t(lang, "yesLabel") : t(lang, "requestSentLabel")}</strong><span>{t(lang, "otherPersonLabel")}</span><strong>{t(lang, "waitingLabel")}</strong></div>
          </div>
        )}

        {stage === "mutual-yes" && (
          <div className="join-panel listener-panel mutual-yes-panel">
            <p className="eyebrow">{t(lang, "mutualEyebrow")}</p>
            <h1>{t(lang, "mutualHeading")}</h1>
            <div className="mutual-cards"><article><span className="mono-label">{t(lang, "storytellerLabel")}</span><strong>{t(lang, "mutualStorytellerYes")}</strong></article><article><span className="mono-label">{t(lang, "listenerLabel")}</span><strong>{t(lang, "mutualListenerYes")}</strong></article></div>
            <section className="conversation-starter">
              <span className="mono-label">{t(lang, "conversationStarterLabel")}</span>
              {(room.snapshot?.guide?.questions ?? [
                t(lang, "mutualFallbackQuestion1"),
                t(lang, "mutualFallbackQuestion2"),
              ]).map((question) => <p key={question}>“{question}”</p>)}
              <small>{room.snapshot?.guide ? t(lang, "geminiOffersLine") : t(lang, "simpleBeginningLine")}</small>
            </section>
            <button className="button button-primary button-block" onClick={() => setStage("listen-profile")}>{t(lang, "offerAnotherButton")}</button>
          </div>
        )}

        {stage === "result" && room.snapshot?.phase === "no-match" && (isConsentParticipant || listenerEntry) && (
          <div className="join-panel result-panel no-match-panel">
            <p className="eyebrow">{t(lang, "consentRespectedEyebrow")}</p>
            <h1>{t(lang, "noConnectionHeading")}</h1>
            <p>{t(lang, "noConnectionBody")}</p>
            <Link className="button button-primary button-block" to="/">{t(lang, "returnHomeButton")}</Link>
          </div>
        )}

        {stage === "welcome" && (
          <div className="join-panel welcome-panel">
            <p className="eyebrow">{t(lang, "welcomeEyebrow")}</p>
            <h1>{t(lang, "welcomeHeading")}</h1>
            <p>{t(lang, "memoryQuestion")}</p>
            <p className="welcome-support">{t(lang, "welcomeSupport")}</p>
            <label className="listener-field welcome-language-field"><span>{t(lang, "languageSelectorLabel")}</span><select value={lang} onChange={(event) => changeLang(event.target.value as Lang)}>{LANG_OPTIONS.map((code) => <option key={code} value={code}>{LANG_LABELS[code]}</option>)}</select></label>
            <button className="button button-primary button-block" onClick={() => setStage("capture")}>{t(lang, "shareMemoryButton")}</button>
            <Link className="text-link role-cross-link" to={`/join/${roomCode}?role=listen`}>{t(lang, "listenInsteadLink")}</Link>
            <p className="privacy-note">{t(lang, "welcomePrivacyNote")}</p>
          </div>
        )}

        {stage === "capture" && (
          <div className="join-panel capture-panel">
            <p className="eyebrow">{t(lang, "captureEyebrow")}</p>
            <h1>{t(lang, "memoryQuestion")}</h1>
            <p className="capture-intro">{t(lang, "captureIntro")}</p>
            <div className="photo-preview">
              {photoData ? <img src={photoData} alt={t(lang, "previewImageAlt")} /> : fixture === "radio" ? <img src={memoryObjects} alt={t(lang, "memoryObjectsImageAlt")} /> : <div className="text-fixture">{t(lang, "noPhotoLabel")}<br />{t(lang, "textFixtureLabel")}</div>}
              <span>{photoLabelText(lang, photoLabel)}</span>
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
              <button className="button button-secondary" onClick={() => fileInputRef.current?.click()}>{t(lang, "addPhotoButton")}</button>
              {preparedImageSelected ? (
                <span className="prepared-image-status" role="status"><span className="prepared-image-badge">{t(lang, "selectedBadgeLabel")}</span>{t(lang, "preparedImageStatus")}</span>
              ) : (
                <button className="text-button" onClick={restorePreparedImage}>{t(lang, "restorePreparedImageButton")}</button>
              )}
            </div>
            <p className="field-help">{t(lang, "photoHelpText")}</p>
            <label className="memory-field">
              <span>{t(lang, "yourWordsLabel")}</span>
              <textarea value={memory} maxLength={600} rows={4} placeholder={t(lang, "yourWordsPlaceholder")} onChange={(event) => setMemory(event.target.value)} />
              <small>{memory.length}/600</small>
            </label>
            <button className="voice-button" type="button" onClick={captureVoice} aria-pressed={isListening}>
              <span className="voice-ring" aria-hidden="true" />
              <span>{isListening ? t(lang, "listeningStatus") : t(lang, "speakMemoryButton")}</span>
              <small>{t(lang, "voiceStaysEditableNote")}</small>
            </button>
            <button className="fixture-link" onClick={() => chooseFixture("no-match")}>{t(lang, "noMatchFixtureLink")}</button>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" disabled={memory.trim().length < 8} onClick={() => void createCapsule()}>{t(lang, "createCapsuleButton")}</button>
          </div>
        )}

        {stage === "processing" && (
          <div className="join-panel processing-panel">
            <div className="processing-window" aria-hidden="true"><span /><span /><span /><span /></div>
            <p className="eyebrow">{t(lang, "processingEyebrow")}</p>
            <h1>{t(lang, "processingHeading")}</h1>
            <p>{t(lang, "processingBody")}</p>
            <p className="processing-elapsed">{elapsedSeconds}{t(lang, "elapsedSuffix")}</p>
            {error && <div className="error-banner" role="status">{error}</div>}
          </div>
        )}

        {stage === "review" && capsule && (
          <div className="join-panel review-panel">
            <p className="eyebrow">{t(lang, "reviewEyebrow")}</p>
            <h1>{t(lang, "reviewHeading")}</h1>
            <section className="words-card">
              <span className="mono-label">{t(lang, "yourWordsCardLabel")}</span>
              <blockquote>“{memory}”</blockquote>
            </section>
            <section className="meaning-card">
              <span className="mono-label">{t(lang, "whatGemmaNoticedLabel")}</span>
              <p>{capsule.safeSummary}</p>
            </section>
            <div className="capsule-evidence">
              {capsule.place && <span><small>{t(lang, "placeLabel")}</small>{capsule.place}</span>}
              {capsule.era && <span><small>{t(lang, "eraLabel")}</small>{capsule.era}</span>}
              {capsule.skills.map((skill) => <span key={skill}><small>{t(lang, "skillLabel")}</small>{skill}</span>)}
              {capsule.offers.map((offer) => <span key={offer}><small>{t(lang, "offerLabel")}</small>{offer}</span>)}
              {capsule.wants.map((want) => <span key={want}><small>{t(lang, "wantsLabel")}</small>{want}</span>)}
            </div>
            {capsule.redactions.length > 0 ? (
              <div className="redaction-note"><strong>{t(lang, "removedBeforeSharingTitle")}</strong><p>{capsule.redactions.join(", ")}</p></div>
            ) : (
              <div className="redaction-note"><strong>{t(lang, "noIdentifiersTitle")}</strong><p>{t(lang, "noIdentifiersBody")}</p></div>
            )}
            <details open>
              <summary>{t(lang, "uncertainSummary")}</summary>
              <ul>{capsule.uncertain.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
            {canReadAloudNow && <button className="button button-secondary button-block" type="button" aria-pressed={isSpeaking} onClick={readReviewAloud}>{isSpeaking ? t(lang, "stopReadingButton") : t(lang, "readToMeButton")}</button>}
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="button button-primary button-block" disabled={pendingAction === "approve"} onClick={() => void approve()}>{pendingAction === "approve" ? t(lang, "approvePending") : t(lang, "approveButton")}</button>
            <button className="button button-secondary button-block" onClick={() => setStage("capture")}>{t(lang, "goBackButton")}</button>
          </div>
        )}

        {stage === "waiting" && (
          <div className="join-panel waiting-panel">
            <div className="window-beacon" aria-hidden="true" />
            <p className="eyebrow">{t(lang, "waitingEyebrow")}</p>
            <h1>{t(lang, "waitingHeading")}</h1>
            <p>{t(lang, "waitingBody")}</p>
          </div>
        )}

        {stage === "result" && room.snapshot?.phase === "matched" && room.snapshot.activeSourceId === participantId && room.snapshot.match && room.snapshot.invite && (
          <div className="join-panel result-panel">
            <p className="eyebrow">{t(lang, "resultEyebrow")}</p>
            <h1>{room.snapshot.invite.title}</h1>
            <p className="result-summary">{room.snapshot.match.why}</p>
            <div className="story-pair">
              <article>
                <span className="mono-label">{t(lang, "yourMemoryLabel")}</span>
                <p>{sourceStory?.safeSummary}</p>
              </article>
              <article>
                <span className="mono-label">{t(lang, "listenerApprovedReasonLabel")}</span>
                <p>{listenerStory?.safeSummary}</p>
              </article>
            </div>
            <div className="evidence-path" aria-label={t(lang, "evidencePathAriaLabel")}>
              {room.snapshot.match.evidencePath.map((evidence) => <span key={evidence}>{evidence}</span>)}
            </div>
            {room.snapshot.guide ? (
              <article className="senior-bridge">
                <span className="mono-label">{t(lang, "guideLabel")}</span>
                <h2>{room.snapshot.guide.introduction}</h2>
                <p className="bridge-intro">{t(lang, "twoQuestionsIntro")}</p>
                <ol>
                  {room.snapshot.guide.questions.map((question) => <li key={question}>{question}</li>)}
                </ol>
                <p className="consent-reminder">{room.snapshot.guide.consentReminder}</p>
                {canReadAloudNow && (
                  <div className="read-aloud-actions">
                    <button className="button button-primary" type="button" aria-pressed={isSpeaking} onClick={speakGuide}>{t(lang, "readAloudButton")}</button>
                    {isSpeaking && <button className="button button-secondary" type="button" onClick={stopSpeaking}>{t(lang, "stopReadingButton")}</button>}
                  </div>
                )}
                <small>{t(lang, "guideDisclaimer")}</small>
              </article>
            ) : room.snapshot.guideError ? (
              <div className="error-banner" role="status">{room.snapshot.guideError}</div>
            ) : room.snapshot.facilitator !== "disabled" ? (
              <p className="guide-pending" role="status">{t(lang, "guidePendingStatus")}</p>
            ) : null}
            {error && <div className="error-banner" role="alert">{error}</div>}
            <article className="kopi-card">
              <span className="mono-label">{t(lang, "kopiCardLabel")}</span>
              <h2>{room.snapshot.invite.invitation}</h2>
              <p>{room.snapshot.invite.activity}</p>
              <small>{t(lang, "kopiDisclaimer")}</small>
            </article>
            <button className="button button-secondary button-block" onClick={startAgain}>{t(lang, "runAgainButton")}</button>
          </div>
        )}

        {stage === "result" && room.snapshot?.phase === "no-match" && !room.snapshot.connectionConsent && room.snapshot.activeSourceId === participantId && (
          <div className="join-panel result-panel no-match-panel">
            <p className="eyebrow">{t(lang, "honestDesignEyebrow")}</p>
            <h1>{t(lang, "noMatchYetHeading")}</h1>
            <p className="no-match-human">{t(lang, "noMatchHumanLine")}</p>
            <p>{room.snapshot.match?.why}</p>
            <div className="no-match-rule">{t(lang, "noMatchRuleLine")}</div>
            <button className="button button-primary button-block" onClick={startAgain}>{t(lang, "tryPreparedStoryButton")}</button>
          </div>
        )}
      </section>
    </main>
  );
}
