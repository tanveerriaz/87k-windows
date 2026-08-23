import { StoryCapsuleSchema, type StoryCapsule } from "../../shared/schemas";

type ExtractInput = {
  roomCode: string;
  memory: string;
  photoData?: string | null;
  fixture?: "radio" | "no-match";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function extractCapsule(input: ExtractInput): Promise<{ capsule: StoryCapsule; capsuleId: string }> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const errorBody = body as { code?: string; message?: string };
    throw new ApiError(errorBody.message ?? "The safe capsule could not be created.", errorBody.code ?? "REQUEST_FAILED");
  }
  const { capsule, capsuleId } = body as { capsule: unknown; capsuleId: string };
  return { capsule: StoryCapsuleSchema.parse(capsule), capsuleId };
}
