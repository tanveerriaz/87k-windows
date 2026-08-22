import type { Provider } from "../../shared/schemas";

export type ProviderPresentation = {
  label: string;
  heading: string;
  detail: string;
  realGemma: boolean;
};

export function providerPresentation(provider?: Provider): ProviderPresentation {
  if (provider === "ollama") {
    return {
      label: "Local Gemma 3 through Ollama",
      heading: "Local Gemma is the room's judging model.",
      detail: "Private inference runs on the presentation Mac. Participant phones install nothing; they open this room over local HTTP, so use a trusted private hotspot.",
      realGemma: true,
    };
  }
  if (provider === "gemma-api") {
    return {
      label: "Hosted Gemma 4 via Gemini API",
      heading: "Hosted Gemma is the hosted fallback for remote access.",
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
