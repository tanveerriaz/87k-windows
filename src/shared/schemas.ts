import { z } from "zod";

export const ProviderSchema = z.enum(["mock", "gemma-api", "ollama"]);

export const StoryCapsuleSchema = z.object({
  id: z.string().min(1),
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

export const RoomSnapshotSchema = z.object({
  roomCode: z.string(),
  provider: ProviderSchema,
  phase: z.enum(["idle", "reviewing", "matching", "matched", "no-match"]),
  windows: z.array(LitWindowSchema),
  match: MatchResultSchema.nullable(),
  invite: KopiCardSchema.nullable(),
  lastError: z.string().nullable(),
  updatedAt: z.string(),
});

export const ExtractRequestSchema = z.object({
  roomCode: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9-]+$/),
  memory: z.string().trim().min(8).max(600),
  photoData: z.string().max(7_000_000).nullable().optional(),
  fixture: z.enum(["radio", "no-match"]).optional(),
});

export const MatchRequestSchema = z.object({
  capsule: StoryCapsuleSchema,
});

export const InviteRequestSchema = z.object({
  roomCode: z.string().trim().min(3).max(24),
  capsule: StoryCapsuleSchema,
  match: MatchResultSchema,
});

export type Provider = z.infer<typeof ProviderSchema>;
export type StoryCapsule = z.infer<typeof StoryCapsuleSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type KopiCard = z.infer<typeof KopiCardSchema>;
export type LitWindow = z.infer<typeof LitWindowSchema>;
export type RoomSnapshot = z.infer<typeof RoomSnapshotSchema>;
