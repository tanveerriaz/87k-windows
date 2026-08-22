# Project Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four project-local skills that preserve 87K Windows product, inference, demo-shipping, and knowledge-capture practices.

**Architecture:** Store concise, automatically discoverable skills under `.agents/skills/`. Keep `AGENTS.md` and the existing sanitized project documents authoritative; each skill supplies task-specific routing, judgment, and verification without copying whole documents. Create and validate one skill at a time using a baseline scenario, a forward scenario, the bundled skill validator, and a focused commit.

**Tech Stack:** Markdown `SKILL.md` files, Codex project skills, Git, the bundled `quick_validate.py` validator

---

### Task 1: Add the product-experience skill

**Files:**
- Create: `.agents/skills/changing-87k-experience/SKILL.md`

**Step 1: Run a baseline scenario without the skill**

Ask an independent agent to plan a realistic Join, Wall, or Admin change using only the current repository. The scenario must pressure it to make a quick UI-only change and omit at least one cross-surface, consent, privacy, accessibility, Canvas, or two-tab/no-match consideration. Record the observed gap in the working notes.

**Step 2: Write the minimal skill**

Create a concise skill with this trigger:

```yaml
---
name: changing-87k-experience
description: Use when changing Join, Wall, or Admin Mode, room events, matching behavior, accessibility, or the participant journey in 87K Windows.
---
```

The body must route to `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`, preserve the consent and ephemeral-data boundary, identify shared-schema and cross-surface impact, keep Wall Mode on Canvas, and select proportionate checks including the positive Queenstown/radio flow and honest no-match flow.

**Step 3: Run the forward scenario with the skill**

Give an independent agent the same request plus the new skill. Verify that its plan covers the baseline omission without inventing new scope.

**Step 4: Validate the skill**

Run:

```bash
python /Users/tanveerriaz/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/changing-87k-experience
```

Expected: `Skill is valid!`

**Step 5: Commit**

```bash
git add .agents/skills/changing-87k-experience/SKILL.md
git commit -m "docs: add 87k experience skill"
```

### Task 2: Add the inference skill

**Files:**
- Create: `.agents/skills/maintaining-87k-inference/SKILL.md`

**Step 1: Run a baseline scenario without the skill**

Ask an independent agent to assess a Gemma provider, prompt, schema, timeout, or fallback change. Apply delivery pressure that could cause it to weaken the typed contract, leak secrets, hide provider truth, log raw content, expose reasoning, or silently fall back to mock inference. Record the observed gap.

**Step 2: Write the minimal skill**

Use this trigger:

```yaml
---
name: maintaining-87k-inference
description: Use when changing or debugging Gemma providers, extraction prompts, capsule schemas, validation, repair, timeouts, fallback behavior, or provider status in 87K Windows.
---
```

Route to `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, and the provider implementation. Preserve server-only secrets, redaction before hosted inference, schema-constrained output plus Zod validation, one safe repair, no room event on failure, evidence/uncertainty instead of hidden reasoning, real Gemma for judging, and mock only for tests/UI development.

**Step 3: Run the forward scenario with the skill**

Repeat the baseline request with the skill and verify truthful provider behavior, safe failure, contract coverage, and focused tests.

**Step 4: Validate the skill**

Run the bundled validator and expect `Skill is valid!`.

**Step 5: Commit**

```bash
git add .agents/skills/maintaining-87k-inference/SKILL.md
git commit -m "docs: add 87k inference skill"
```

### Task 3: Add the demo-shipping skill

**Files:**
- Create: `.agents/skills/shipping-87k-demo/SKILL.md`

**Step 1: Run a baseline scenario without the skill**

Ask an independent agent to prepare a judging build containing a generated asset and Cloud Run readiness work. Apply time pressure that could cause it to skip provenance, use non-synthetic material, confuse readiness with deployment permission, show mock inference, or omit a critical verification gate. Record the observed gap.

**Step 2: Write the minimal skill**

Use this trigger:

```yaml
---
name: shipping-87k-demo
description: Use when preparing, verifying, rehearsing, recording, or releasing the 87K Windows demo, generated assets, public repository, Mac fallback, or Cloud Run build.
---
```

Route conditionally to `docs/DEMO_SCRIPT.md`, `docs/SUBMISSION.md`, `docs/ASSET_PROVENANCE.md`, `docs/MAC_SETUP.md`, and `docs/GCP_DEPLOYMENT.md`. Preserve synthetic/public-safe artifacts, provenance, truthful provider status, full gates, two-tab rehearsal, and exact-project authorization before cloud mutation. Never infer permission to push, deploy, or alter cloud resources.

**Step 3: Run the forward scenario with the skill**

Repeat the scenario and verify that preparation remains read-only until exact authorization, that public-repository hygiene is checked, and that real-model and no-match flows are rehearsed.

**Step 4: Validate the skill**

Run the bundled validator and expect `Skill is valid!`.

**Step 5: Commit**

```bash
git add .agents/skills/shipping-87k-demo/SKILL.md
git commit -m "docs: add 87k demo shipping skill"
```

### Task 4: Add the lesson-preservation skill

**Files:**
- Create: `.agents/skills/preserving-87k-lessons/SKILL.md`

**Step 1: Run a baseline scenario without the skill**

Ask an independent agent where to preserve a newly discovered recurring failure or decision. Use a scenario where a test, script, project rule, skill update, and design document are all plausible. Record whether it duplicates guidance, writes a narrative, or chooses documentation when an executable guard is possible.

**Step 2: Write the minimal skill**

Use this trigger:

```yaml
---
name: preserving-87k-lessons
description: Use when a recurring failure, non-obvious project decision, resolved pitfall, or reusable workaround is discovered while working on 87K Windows.
---
```

Teach the storage decision: automate mechanical invariants in tests/scripts; keep repository-wide rules in `AGENTS.md`; update the narrowest existing skill for reusable judgment; use sanitized project docs for durable architecture/product facts; do not preserve secrets, personal data, raw submissions, machine paths, or one-off narratives. Require checking existing locations before adding new guidance.

**Step 3: Run the forward scenario with the skill**

Repeat the scenario and verify that it chooses one authoritative home, favors executable prevention, avoids duplication, and keeps public-repository content sanitized.

**Step 4: Validate the skill**

Run the bundled validator and expect `Skill is valid!`.

**Step 5: Commit**

```bash
git add .agents/skills/preserving-87k-lessons/SKILL.md
git commit -m "docs: add 87k lesson preservation skill"
```

### Task 5: Verify the complete project-skill set

**Files:**
- Verify: `.agents/skills/*/SKILL.md`
- Verify: `docs/plans/2026-08-22-project-skills-design.md`
- Verify: `docs/plans/2026-08-22-project-skills.md`

**Step 1: Validate all four skills**

Run `quick_validate.py` once for each skill directory. Expected: four successful validations.

**Step 2: Check discovery metadata and size**

Confirm every directory name matches its frontmatter name, every description begins with `Use when`, and each `SKILL.md` remains concise enough to load without unrelated context.

**Step 3: Check repository safety**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; pre-existing asset changes remain present and uncommitted.

**Step 4: Commit the plan**

```bash
git add docs/plans/2026-08-22-project-skills.md
git commit -m "docs: plan project skills"
```
