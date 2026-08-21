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

export async function extractCapsule(input: ExtractInput): Promise<StoryCapsule> {
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
  return StoryCapsuleSchema.parse((body as { capsule: unknown }).capsule);
}
