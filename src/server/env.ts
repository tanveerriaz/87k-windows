import { z } from "zod";
import { ProviderSchema } from "../shared/schemas";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  INFERENCE_PROVIDER: ProviderSchema.default("mock"),
  GEMMA_MODEL: z.string().default("gemma-4-26b-a4b-it"),
  GEMINI_API_KEY: z.string().trim().default(""),
  OLLAMA_BASE_URL: z.url().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("gemma3:4b"),
  DEMO_ADMIN_SECRET: z.string().default(""),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_000_000),
  ROOM_TTL_MINUTES: z.coerce.number().int().positive().default(120),
  MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.62),
}).superRefine((env, context) => {
  if (env.INFERENCE_PROVIDER === "gemma-api" && env.GEMINI_API_KEY.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["GEMINI_API_KEY"],
      message: "GEMINI_API_KEY is required when INFERENCE_PROVIDER is gemma-api.",
    });
  }
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(source);
}
