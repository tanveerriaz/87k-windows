# Gemini Senior Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a safe, voice-accessible Gemini conversation bridge after local Gemma and deterministic matching.

**Architecture:** Add a typed facilitator contract with real Gemini, deterministic test, and disabled implementations. RoomStore calls it only after an approved capsule produces a valid deterministic match; the resulting structured guide enters ephemeral room state and is rendered with client-side speech controls.

**Tech Stack:** TypeScript, Zod, `@google/genai`, Express, Socket.IO, React, Vitest, Playwright

---

### Task 1: Shared Gemini bridge contract

Create the guide and facilitator-mode schemas in `src/shared/schemas.ts`, extend room snapshots and events, and add focused schema tests. Observe failure before implementation.

### Task 2: Gemini facilitator provider

Create `src/server/facilitation/provider.ts`, `gemini-facilitator.ts`, and `mock-facilitator.ts`. Test that only safe capsule fields and visible evidence enter the prompt, structured JSON is validated, and failures remain explicit.

### Task 3: Room orchestration

Inject the facilitator into `RoomStore`, call it only after `MATCH`, preserve latest-participant/reset guards across the async call, and prove `NO MATCH YET` never invokes Gemini.

### Task 4: Senior-facing UI

Render the Gemini guide on matched Join and Wall surfaces, add at least 48 px read-aloud/stop controls with a slower speech rate, and display truthful facilitator status in Admin/Status surfaces. Extend E2E for the positive guide and negative no-call path.

### Task 5: Judge launcher and documentation

Add `demo:judge`, Gemini facilitator environment validation, `gemini-3.6-flash` configuration, machine readiness reporting, and dual-track README/submission/demo-script language. Run all repository quality gates and a real Gemini smoke test if credentials are available.
