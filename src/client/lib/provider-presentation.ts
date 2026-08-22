import type { Facilitator, Provider } from "../../shared/schemas";

export type ProviderPresentation = {
  label: string;
  heading: string;
  detail: string;
  realGemma: boolean;
};

export type FacilitatorPresentation = {
  label: string;
  heading: string;
  detail: string;
  realGemini: boolean;
};

export function providerPresentation(provider?: Provider): ProviderPresentation {
  if (provider === "ollama") {
    return {
      label: "Local Gemma 3 through Ollama",
      heading: "Gemma keeps the raw memory local.",
      detail: "Gemma 3 prepares the reviewable capsule on the presentation Mac. Participant phones install nothing; they open this room over a trusted private hotspot.",
      realGemma: true,
    };
  }
  if (provider === "gemma-api") {
    return {
      label: "Hosted Gemma 4 via Gemini API",
      heading: "Hosted Gemma is the privacy-layer fallback.",
      detail: "Real Gemma is running through the server-side API for remote access. The API key never reaches participant phones.",
      realGemma: true,
    };
  }
  if (provider === "mock") {
    return {
      label: "Development test harness",
      heading: "Development test harness",
      detail: "Test harness active. This mode is for development and automated checks, never judging.",
      realGemma: false,
    };
  }
  return {
    label: "Connecting to inference",
    heading: "Checking the room model.",
    detail: "The room will identify its inference provider before a memory is submitted.",
    realGemma: false,
  };
}

export function facilitatorPresentation(facilitator?: Facilitator): FacilitatorPresentation {
  if (facilitator === "gemini") {
    return {
      label: "Gemini 3.6 Flash · senior connection guide",
      heading: "Gemini helps two seniors begin safely.",
      detail: "After an evidence-backed match, Gemini turns only the approved safe capsules into two gentle, read-aloud questions. It never receives the raw memory or chooses the match.",
      realGemini: true,
    };
  }
  if (facilitator === "mock") {
    return {
      label: "Mock Gemini guide",
      heading: "Gemini guide test double",
      detail: "Deterministic guide generation is active for automated tests only. Never present this runtime during judging.",
      realGemini: false,
    };
  }
  return {
    label: "Gemini senior guide disabled",
    heading: "Gemini guide is not active.",
    detail: "The grounded matching flow still works, but Track 2 judging requires the Gemini facilitator runtime.",
    realGemini: false,
  };
}
