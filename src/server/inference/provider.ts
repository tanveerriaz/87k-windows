import type { StoryCapsule } from "../../shared/schemas";

export type ExtractInput = {
  memory: string;
  fixture?: "radio" | "no-match";
};

export interface InferenceProvider {
  extract(input: ExtractInput): Promise<StoryCapsule>;
}

export class ProviderOutputError extends Error {
  constructor(message = "The model returned an answer that could not be checked.") {
    super(message);
    this.name = "ProviderOutputError";
  }
}

export class ProviderTimeoutError extends Error {
  constructor(message = "The model took too long to respond.") {
    super(message);
    this.name = "ProviderTimeoutError";
  }
}
