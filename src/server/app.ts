import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  ExtractRequestSchema,
  InviteRequestSchema,
  MatchRequestSchema,
  StoryCapsuleSchema,
} from "../shared/schemas";
import type { AppEnv } from "./env";
import { GeminiFacilitator } from "./facilitation/gemini-facilitator";
import { MockFacilitator } from "./facilitation/mock-facilitator";
import { DisabledFacilitator, type ConnectionFacilitator } from "./facilitation/provider";
import { MockProvider } from "./inference/mock-provider";
import { OllamaProvider } from "./inference/ollama-provider";
import { GemmaApiProvider } from "./inference/gemma-api-provider";
import { ProviderBusyError, ProviderOutputError, ProviderTimeoutError, type InferenceProvider } from "./inference/provider";
import { StoryMatcher } from "./matching/matcher";
import { OpenRouterGenAiClient } from "./openrouter-client";
import type { RoomStore } from "./rooms";

export type AppDependencies = {
  env: AppEnv;
  provider: InferenceProvider;
  matcher: StoryMatcher;
  rooms: RoomStore;
};

export type RuntimeDependencies = {
  env: AppEnv;
  provider: InferenceProvider;
  matcher: StoryMatcher;
  facilitator: ConnectionFacilitator;
};

function errorPayload(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof ProviderBusyError) {
    return { status: 409, code: "LOCAL_GEMMA_BUSY", message: error.message };
  }
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
  const { env, provider, matcher, rooms } = dependencies;
  const app = express();

  app.disable("x-powered-by");
  // Cloud Run is the single trusted proxy in front of this service, but only
  // in production. Outside production there is no proxy in front of Express,
  // so trusting X-Forwarded-For would let any client spoof its own req.ip.
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  const inferenceLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (request) => ipKeyGenerator(request.ip ?? request.socket.remoteAddress ?? "unknown"),
    message: { code: "RATE_LIMITED", message: "Too many demo requests. Wait a moment and try again." },
  });

  // A demo request is a short memory (max 600 chars) plus a small envelope;
  // 64kb comfortably covers it with no photo payload to size for.
  const jsonBody = express.json({ limit: "64kb" });

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

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.post("/api/extract", inferenceLimiter, jsonBody, async (request, response) => {
    try {
      const input = ExtractRequestSchema.parse(request.body);
      const capsule = StoryCapsuleSchema.parse(await provider.extract({ memory: input.memory, fixture: input.fixture }));
      const capsuleId = rooms.registerCapsule(capsule);
      return response.json({ capsule, capsuleId, provider: env.INFERENCE_PROVIDER });
    } catch (error) {
      const payload = errorPayload(error);
      return response.status(payload.status).json({ code: payload.code, message: payload.message });
    }
  });

  app.post("/api/match", inferenceLimiter, jsonBody, (request, response) => {
    try {
      const { capsule } = MatchRequestSchema.parse(request.body);
      return response.json({ match: matcher.match(capsule) });
    } catch (error) {
      const payload = errorPayload(error);
      return response.status(payload.status).json({ code: payload.code, message: payload.message });
    }
  });

  app.post("/api/invite", inferenceLimiter, jsonBody, (request, response) => {
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
      // The exact SPA entry is safe to serve even when a development worktree lives under a hidden directory.
      return response.sendFile(resolve(clientDirectory, "index.html"), { dotfiles: "allow" });
    });
  }

  app.use((_request, response) => {
    response.status(404).json({ code: "NOT_FOUND", message: "Route not found." });
  });

  return app;
}

export function defaultDependencies(env: AppEnv): RuntimeDependencies {
  const openRouterClient = env.INFERENCE_PROVIDER === "openrouter"
    ? new OpenRouterGenAiClient(env.OPENROUTER_BASE_URL, env.OPENROUTER_API_KEY)
    : undefined;
  return {
    env,
    provider:
      env.INFERENCE_PROVIDER === "ollama"
        ? new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL)
        : env.INFERENCE_PROVIDER === "gemma-api"
          ? new GemmaApiProvider(env.GEMINI_API_KEY, env.GEMMA_MODEL)
        : env.INFERENCE_PROVIDER === "openrouter" && openRouterClient
          ? new GemmaApiProvider(env.OPENROUTER_API_KEY, env.OPENROUTER_GEMMA_MODEL, openRouterClient)
        : new MockProvider(),
    facilitator:
      env.GEMINI_FACILITATOR === "gemini"
        ? env.INFERENCE_PROVIDER === "openrouter" && openRouterClient
          ? new GeminiFacilitator(env.OPENROUTER_API_KEY, env.OPENROUTER_GEMINI_MODEL, openRouterClient)
          : new GeminiFacilitator(env.GEMINI_API_KEY, env.GEMINI_MODEL)
        : env.GEMINI_FACILITATOR === "mock"
          ? new MockFacilitator()
          : new DisabledFacilitator(),
    matcher: new StoryMatcher(undefined, env.MATCH_THRESHOLD),
  };
}
