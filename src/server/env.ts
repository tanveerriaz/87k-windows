import { z } from "zod";
import { FacilitatorSchema, ProviderSchema } from "../shared/schemas";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  INFERENCE_PROVIDER: ProviderSchema.default("mock"),
  GEMMA_MODEL: z.string().default("gemma-4-26b-a4b-it"),
  GEMINI_FACILITATOR: FacilitatorSchema.default("disabled"),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  GEMINI_API_KEY: z.string().trim().default(""),
  OPENROUTER_BASE_URL: z.url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_API_KEY: z.string().trim().default(""),
  OPENROUTER_GEMMA_MODEL: z.string().default("google/gemma-3-27b-it"),
  OPENROUTER_GEMINI_MODEL: z.string().default("google/gemini-3.6-flash"),
  OLLAMA_BASE_URL: z.url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("gemma3:4b"),
  DEMO_ADMIN_SECRET: z.string().default(""),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_000_000),
  ROOM_TTL_MINUTES: z.coerce.number().int().positive().default(120),
  MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.62),
}).superRefine((env, context) => {
  const needsGeminiKey = env.INFERENCE_PROVIDER === "gemma-api"
    || (env.GEMINI_FACILITATOR === "gemini" && env.INFERENCE_PROVIDER !== "openrouter");
  if (needsGeminiKey && env.GEMINI_API_KEY.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["GEMINI_API_KEY"],
      message: "GEMINI_API_KEY is required for hosted Gemma or Gemini senior facilitation.",
    });
  }
  if (env.INFERENCE_PROVIDER === "openrouter" && env.OPENROUTER_API_KEY.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["OPENROUTER_API_KEY"],
      message: "OPENROUTER_API_KEY is required for OpenRouter-hosted Gemma and Gemini.",
    });
  }
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(source);
}
