import { describe, expect, it } from "vitest";
import { LANG_LABELS, SPEECH_LOCALE, t, type Lang, type UiStringKey } from "../../src/client/lib/i18n";

const LANGS: Lang[] = ["en", "zh", "ms", "ta"];

describe("i18n dictionary", () => {
  it("resolves every UiStringKey to a non-empty string in all four languages", () => {
    const allKeys = Object.keys(ENGLISH_KEYS) as UiStringKey[];
    for (const lang of LANGS) {
      for (const key of allKeys) {
        const value = t(lang, key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("differs between zh and en for the memory question", () => {
    expect(t("zh", "memoryQuestion")).not.toBe(t("en", "memoryQuestion"));
    expect(t("zh", "memoryQuestion")).toBe("小时候，什么小事让你开心？");
  });

  it("falls back to the English string for an unsupported language code", () => {
    const invalidLang = "xx" as Lang;
    expect(t(invalidLang, "welcomeHeading")).toBe(t("en", "welcomeHeading"));
  });

  it("has BCP-47 speech locales for all four languages", () => {
    expect(SPEECH_LOCALE.en).toBe("en-SG");
    expect(SPEECH_LOCALE.zh).toBe("zh-SG");
    expect(SPEECH_LOCALE.ms).toBe("ms-MY");
    expect(SPEECH_LOCALE.ta).toBe("ta-SG");
  });

  it("has native-script labels for all four languages", () => {
    expect(LANG_LABELS.en).toBe("English");
    expect(LANG_LABELS.zh).toBe("中文");
    expect(LANG_LABELS.ms).toBe("Bahasa Melayu");
    expect(LANG_LABELS.ta).toBe("தமிழ்");
  });
});

// A representative, hand-maintained subset of UiStringKey used to drive the
// "every key resolves" assertion without importing implementation internals.
const ENGLISH_KEYS: Record<UiStringKey, true> = {
  landingNavBadge: true,
  landingEyebrow: true,
  landingHeadline: true,
  landingVideoAriaLabel: true,
  landingCopy: true,
  landingShareTitle: true,
  landingShareSubtitle: true,
  landingListenSubtitle: true,
  landingAssuranceContact: true,
  landingAssuranceConsent: true,
  landingFooterGemma: true,
  landingFooterGemini: true,
  landingViewWallLink: true,
  landingRoleChoicesAriaLabel: true,
  memoryQuestion: true,
  welcomeEyebrow: true,
  welcomeHeading: true,
  welcomeSupport: true,
  shareMemoryButton: true,
  listenInsteadLink: true,
  welcomePrivacyNote: true,
  languageSelectorLabel: true,
  journeyYouShared: true,
  journeyGemmaProtected: true,
  journeyYouApproved: true,
  journeyStoryMatched: true,
  journeyStillListening: true,
  journeyGeminiGuides: true,
  roleSwitchHaveStory: true,
  roleSwitchWouldListen: true,
  listenProfileEyebrow: true,
  listenProfileHeading: true,
  listenProfileIntro: true,
  languageFieldLabel: true,
  timeFieldLabel: true,
  timeOptionShortConvo: true,
  timeOption15Min: true,
  timeOptionVisit: true,
  seeInvitationButton: true,
  listenerPrivacyNote: true,
  invitationEyebrow: true,
  invitationFallbackHeading: true,
  whatTheyChoseLabel: true,
  invitationFallbackBody: true,
  invitationDisclaimer: true,
  listenerReasonLabel: true,
  listenerOfferedPrefix: true,
  prepareRequestButton: true,
  changeOfferButton: true,
  listenProcessingEyebrow: true,
  listenProcessingHeading: true,
  listenProcessingBody: true,
  elapsedSuffix: true,
  consentEyebrow: true,
  consentHeading: true,
  storytellerLabel: true,
  listenerLabel: true,
  consentPrivacyNote: true,
  consentYesButton: true,
  consentPending: true,
  consentNoButton: true,
  requestedEyebrow: true,
  requestedHeading: true,
  requestedBody: true,
  yourChoiceLabel: true,
  requestSentLabel: true,
  otherPersonLabel: true,
  waitingLabel: true,
  yesLabel: true,
  mutualEyebrow: true,
  mutualHeading: true,
  mutualStorytellerYes: true,
  mutualListenerYes: true,
  conversationStarterLabel: true,
  geminiOffersLine: true,
  simpleBeginningLine: true,
  offerAnotherButton: true,
  consentRespectedEyebrow: true,
  noConnectionHeading: true,
  noConnectionBody: true,
  returnHomeButton: true,
  captureEyebrow: true,
  captureIntro: true,
  addPhotoButton: true,
  preparedImageStatus: true,
  selectedBadgeLabel: true,
  restorePreparedImageButton: true,
  photoHelpText: true,
  preparedRadioImageLabel: true,
  noMatchFixtureImageLabel: true,
  preparedInMemoryOnlySuffix: true,
  noPhotoLabel: true,
  textFixtureLabel: true,
  yourWordsLabel: true,
  yourWordsPlaceholder: true,
  listeningStatus: true,
  speakMemoryButton: true,
  voiceStaysEditableNote: true,
  noMatchFixtureLink: true,
  createCapsuleButton: true,
  processingEyebrow: true,
  processingHeading: true,
  processingBody: true,
  reviewEyebrow: true,
  reviewHeading: true,
  yourWordsCardLabel: true,
  whatGemmaNoticedLabel: true,
  placeLabel: true,
  eraLabel: true,
  skillLabel: true,
  offerLabel: true,
  wantsLabel: true,
  removedBeforeSharingTitle: true,
  noIdentifiersTitle: true,
  noIdentifiersBody: true,
  uncertainSummary: true,
  readToMeButton: true,
  stopReadingButton: true,
  approveButton: true,
  approvePending: true,
  goBackButton: true,
  waitingEyebrow: true,
  waitingHeading: true,
  waitingBody: true,
  resultEyebrow: true,
  yourMemoryLabel: true,
  listenerApprovedReasonLabel: true,
  guideLabel: true,
  englishFallbackLabel: true,
  twoQuestionsIntro: true,
  readAloudButton: true,
  guideDisclaimer: true,
  kopiCardLabel: true,
  kopiDisclaimer: true,
  runAgainButton: true,
  guidePendingStatus: true,
  honestDesignEyebrow: true,
  noMatchYetHeading: true,
  noMatchHumanLine: true,
  noMatchRuleLine: true,
  tryPreparedStoryButton: true,
  errorLocalModelBusy: true,
  errorNothingShared: true,
  errorApprovalNotShared: true,
  errorApprovalFailed: true,
  errorCapsuleNotCreated: true,
  errorListeningRequestFailed: true,
  errorChoiceNotRecorded: true,
  errorVoiceUnavailable: true,
  errorVoiceNotClear: true,
  errorVoiceLanguageUnavailable: true,
  errorReadAloudUnavailableGuide: true,
  errorReadAloudUnavailableCapsule: true,
  errorRoomUnreachable: true,
  errorRoomNoResponse: true,
  errorConnectionFailed: true,
  errorPhotoFallback: true,
  errorRoomMoved: true,
  errorListenerRoomMoved: true,
  errorDisplaced: true,
  mutualFallbackQuestion1: true,
  mutualFallbackQuestion2: true,
  roomLabelPrefix: true,
  progressAriaLabel: true,
  evidencePathAriaLabel: true,
  invitationImageAlt: true,
  previewImageAlt: true,
  memoryObjectsImageAlt: true,
  matchWhyComplement: true,
  matchWhyShared: true,
  matchWhyNoMatch: true,
  matchPlaceFallback: true,
  matchEraFallback: true,
  matchSkillFallback: true,
  resultMutualYesTitle: true,
  kopiInvitationLine: true,
  kopiActivityLine: true,
  dismissButton: true,
};
