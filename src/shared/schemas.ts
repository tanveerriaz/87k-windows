import { z } from "zod";

export const ProviderSchema = z.enum(["mock", "gemma-api", "openrouter", "ollama"]);
export const FacilitatorSchema = z.enum(["disabled", "gemini", "mock"]);
export const LanguageSchema = z.enum(["en", "zh", "ms", "ta"]);

export const SeniorBridgeSchema = z.object({
  // The storyteller's language — the language introduction/questions/
  // consentReminder are actually written in. Lets the client pick the
  // right read-aloud voice and decide when to show englishFallback.
  language: LanguageSchema.default("en"),
  introduction: z.string().trim().min(1).max(240),
  questions: z.tuple([
    z.string().trim().min(1).max(200),
    z.string().trim().min(1).max(200),
  ]),
  consentReminder: z.string().trim().min(1).max(180),
  // Requested only when the listener's language differs from the
  // storyteller's, so a viewer whose language differs from the guide's can
  // still read it. Absent (not just empty) otherwise — no wasted output.
  englishFallback: z
    .object({
      introduction: z.string().trim().min(1).max(240),
      questions: z.tuple([
        z.string().trim().min(1).max(200),
        z.string().trim().min(1).max(200),
      ]),
    })
    .optional(),
});

export const StoryCapsuleSchema = z.object({
  id: z.string().min(1),
  language: LanguageSchema.default("en"),
  observed: z.array(z.string()),
  place: z.string().nullable(),
  era: z.string().nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  offers: z.array(z.string()),
  wants: z.array(z.string()),
  safeSummary: z.string().min(1).max(360),
  containsPII: z.boolean(),
  redactions: z.array(z.string()),
  uncertain: z.array(z.string()),
});

export const MatchResultSchema = z.object({
  decision: z.enum(["MATCH", "NO_MATCH"]),
  candidateId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  evidencePath: z.array(z.string()),
  why: z.string(),
  invitation: z.string().nullable(),
  scene: z
    .object({
      fromWindow: z.number().int().nonnegative(),
      toWindow: z.number().int().nonnegative(),
      colour: z.enum(["amber", "mint", "violet"]),
    })
    .nullable(),
});

export const KopiCardSchema = z.object({
  title: z.string(),
  invitation: z.string(),
  activity: z.string(),
  roomCode: z.string(),
});

export const LitWindowSchema = z.object({
  participantId: z.string(),
  windowId: z.number().int().nonnegative(),
  colour: z.enum(["amber", "mint", "violet"]),
  safeSummary: z.string(),
});

export const ConsentDecisionSchema = z.enum(["pending", "yes", "no"]);

export const ConnectionConsentSchema = z.object({
  sourceParticipantId: z.string().min(1),
  candidateParticipantId: z.string().min(1),
  sourceDecision: ConsentDecisionSchema,
  candidateDecision: ConsentDecisionSchema,
  mutualYes: z.boolean(),
});

export const RoomSnapshotSchema = z.object({
  roomCode: z.string(),
  provider: ProviderSchema,
  facilitator: FacilitatorSchema,
  phase: z.enum(["idle", "reviewing", "matching", "matched", "no-match"]),
  windows: z.array(LitWindowSchema),
  activeSourceId: z.string().nullable(),
  activeCandidateId: z.string().nullable(),
  connectionConsent: ConnectionConsentSchema.nullable().optional(),
  match: MatchResultSchema.nullable(),
  invite: KopiCardSchema.nullable(),
  guide: SeniorBridgeSchema.nullable(),
  guideError: z.string().nullable(),
  lastError: z.string().nullable(),
  updatedAt: z.string(),
});

export const ExtractRequestSchema = z.object({
  roomCode: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9-]+$/),
  memory: z.string().trim().min(8).max(600),
  fixture: z.enum(["radio", "no-match"]).optional(),
  language: LanguageSchema.default("en"),
});

export const MatchRequestSchema = z.object({
  capsule: StoryCapsuleSchema,
});

export const InviteRequestSchema = z.object({
  roomCode: z.string().trim().min(3).max(24),
  capsule: StoryCapsuleSchema,
  match: MatchResultSchema,
});

export const RoomCodeSchema = z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9-]+$/);

export const RoomJoinPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  role: z.enum(["join", "wall", "admin"]),
  adminSecret: z.string().max(128).optional(), // consumed in Task 6
});

export const StorySubmittedPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  participantId: z.string().min(1).max(64),
});

export const CapsuleApprovedPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  participantId: z.string().min(1).max(64),
  capsuleId: z.string().uuid(),
});

export const ConsentDecidedPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  participantId: z.string().min(1).max(64),
  decision: z.enum(["yes", "no"]),
});

export const RoomOnlyPayloadSchema = z.object({ roomCode: RoomCodeSchema });

export const ProviderChangedPayloadSchema = z.object({
  roomCode: RoomCodeSchema,
  provider: ProviderSchema,
});

export type Provider = z.infer<typeof ProviderSchema>;
export type Facilitator = z.infer<typeof FacilitatorSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type SeniorBridge = z.infer<typeof SeniorBridgeSchema>;
export type StoryCapsule = z.infer<typeof StoryCapsuleSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type KopiCard = z.infer<typeof KopiCardSchema>;
export type LitWindow = z.infer<typeof LitWindowSchema>;
export type ConsentDecision = z.infer<typeof ConsentDecisionSchema>;
export type ConnectionConsent = z.infer<typeof ConnectionConsentSchema>;
export type RoomSnapshot = z.infer<typeof RoomSnapshotSchema>;
