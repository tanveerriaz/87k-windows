import { StoryCapsuleSchema, type Language, type StoryCapsule } from "../../shared/schemas";
import type { UiStringKey } from "./i18n";

type ExtractInput = {
  roomCode: string;
  memory: string;
  fixture?: "radio" | "no-match";
  language?: Language;
};

const UNAVAILABLE_MESSAGE = "We couldn't reach the room right now. Please try again in a moment.";
const CAPSULE_NOT_CREATED_MESSAGE = "The safe capsule could not be created.";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    /** Set only for client-authored friendly messages; join-page.tsx prefers this over `message` so the text renders in the participant's language. Absent for dynamic server-supplied messages, which stay English. */
    public readonly key?: UiStringKey,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get friendlyMessage(): string {
    return this.message;
  }
}

export async function extractCapsule(input: ExtractInput): Promise<{ capsule: StoryCapsule; capsuleId: string }> {
  let response: Response;
  try {
    response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(40_000),
    });
  } catch {
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE", "errorRoomUnreachable");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE", "errorRoomUnreachable");
  }

  if (!response.ok) {
    const errorBody = body as { code?: string; message?: string };
    throw new ApiError(
      errorBody.message ?? CAPSULE_NOT_CREATED_MESSAGE,
      errorBody.code ?? "REQUEST_FAILED",
      errorBody.message ? undefined : "errorCapsuleNotCreated",
    );
  }

  try {
    const { capsule, capsuleId } = body as { capsule: unknown; capsuleId: string };
    return { capsule: StoryCapsuleSchema.parse(capsule), capsuleId };
  } catch {
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE", "errorRoomUnreachable");
  }
}
