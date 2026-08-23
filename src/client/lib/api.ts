import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";

type ExtractInput = {
  roomCode: string;
  memory: string;
  fixture?: "radio" | "no-match";
};

const UNAVAILABLE_MESSAGE = "We couldn't reach the room right now. Please try again in a moment.";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
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
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE");
  }

  if (!response.ok) {
    const errorBody = body as { code?: string; message?: string };
    throw new ApiError(errorBody.message ?? "The safe capsule could not be created.", errorBody.code ?? "REQUEST_FAILED");
  }

  try {
    const { capsule, capsuleId } = body as { capsule: unknown; capsuleId: string };
    return { capsule: StoryCapsuleSchema.parse(capsule), capsuleId };
  } catch {
    throw new ApiError(UNAVAILABLE_MESSAGE, "UNAVAILABLE");
  }
}
