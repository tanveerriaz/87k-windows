import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  ExtractRequestSchema,
  InviteRequestSchema,
  MatchRequestSchema,
  StoryCapsuleSchema,
} from "../shared/schemas";
import type { AppEnv } from "./env";
import { MockProvider } from "./inference/mock-provider";
import { OllamaProvider } from "./inference/ollama-provider";
import { GemmaApiProvider } from "./inference/gemma-api-provider";
import { ProviderOutputError, ProviderTimeoutError, type InferenceProvider } from "./inference/provider";
import { StoryMatcher } from "./matching/matcher";

export type AppDependencies = {
  env: AppEnv;
  provider: InferenceProvider;
  matcher: StoryMatcher;
};

function errorPayload(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof ProviderOutputError) {
    return { status: 502, code: "INVALID_MODEL_OUTPUT", message: `${error.message} Nothing was shared. Please try again.` };
  }
  if (error instanceof ProviderTimeoutError) {
    return { status: 504, code: "PROVIDER_TIMEOUT", message: `${error.message} Nothing was shared. Please try again.` };
  }
  if (error instanceof z.ZodError) {
    return { status: 400, code: "INVALID_REQUEST", message: "Check the memory and image, then try again." };
  }
  return { status: 500, code: "UNEXPECTED_ERROR", message: "The safe capsule could not be created. Nothing was shared." };
}

export function createApp(dependencies: AppDependencies): express.Express {
  const { env, provider, matcher } = dependencies;
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: Math.ceil(env.MAX_UPLOAD_BYTES * 1.45) }));
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    response.setHeader("X-Request-Id", requestId);
    response.on("finish", () => {
      const durationMs = Math.round(performance.now() - startedAt);
      console.info(JSON.stringify({ requestId, method: request.method, path: request.path, status: response.statusCode, durationMs }));
    });
    next();
  });

  const inferenceLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { code: "RATE_LIMITED", message: "Too many demo requests. Wait a moment and try again." },
  });

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", provider: env.INFERENCE_PROVIDER, mode: env.NODE_ENV, uptimeSeconds: Math.round(process.uptime()) });
  });

  app.post("/api/extract", inferenceLimiter, async (request, response) => {
    try {
      const input = ExtractRequestSchema.parse(request.body);
      if (input.photoData) {
        const approximateBytes = Math.floor((input.photoData.length * 3) / 4);
        if (approximateBytes > env.MAX_UPLOAD_BYTES) {
          return response.status(413).json({ code: "IMAGE_TOO_LARGE", message: "Choose an image smaller than 5 MB." });
        }
      }
      const capsule = StoryCapsuleSchema.parse(await provider.extract({ memory: input.memory, fixture: input.fixture }));
      return response.json({ capsule, provider: env.INFERENCE_PROVIDER });
    } catch (error) {
      const payload = errorPayload(error);
      return response.status(payload.status).json({ code: payload.code, message: payload.message });
    }
  });

  app.post("/api/match", inferenceLimiter, (request, response) => {
    try {
      const { capsule } = MatchRequestSchema.parse(request.body);
      return response.json({ match: matcher.match(capsule) });
    } catch (error) {
      const payload = errorPayload(error);
      return response.status(payload.status).json({ code: payload.code, message: payload.message });
    }
  });

  app.post("/api/invite", inferenceLimiter, (request, response) => {
    try {
      const { roomCode, match } = InviteRequestSchema.parse(request.body);
      if (match.decision === "NO_MATCH") {
        return response.status(409).json({ code: "NO_MATCH", message: "An invitation needs a validated match." });
      }
      return response.json({
        card: {
          title: "A small bridge, ready when you are",
          invitation: match.invitation ?? "Kopi and a shared story?",
          activity: "Meet at the community table for 30 minutes.",
          roomCode,
        },
      });
    } catch (error) {
      const payload = errorPayload(error);
      return response.status(payload.status).json({ code: payload.code, message: payload.message });
    }
  });

  const clientDirectory = resolve(process.cwd(), "dist/client");
  if (existsSync(clientDirectory)) {
    app.use(express.static(clientDirectory, { index: false }));
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api/") || request.path === "/health") {
        return next();
      }
      return response.sendFile(resolve(clientDirectory, "index.html"));
    });
  }

  app.use((_request, response) => {
    response.status(404).json({ code: "NOT_FOUND", message: "Route not found." });
  });

  return app;
}

export function defaultDependencies(env: AppEnv): AppDependencies {
  return {
    env,
    provider:
      env.INFERENCE_PROVIDER === "ollama"
        ? new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL)
        : env.INFERENCE_PROVIDER === "gemma-api"
          ? new GemmaApiProvider(env.GEMINI_API_KEY, env.GEMMA_MODEL)
        : new MockProvider(),
    matcher: new StoryMatcher(undefined, env.MATCH_THRESHOLD),
  };
}
