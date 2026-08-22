# Project Skills Design

## Goal

Preserve the recurring decisions, workflows, and failure-prevention knowledge from 87K Windows as project-local Codex skills so future work does not rediscover the same constraints or repeat resolved mistakes.

## Location and discovery

Store the skills under `.agents/skills/` so they are version-controlled with the repository and available to collaborators working on this project. Keep `AGENTS.md` as the source of stable repository-wide rules. Skills add task-specific judgment and procedures without duplicating those rules.

## Skill set

### `changing-87k-experience`

Use for changes to Join, Wall, or Admin Mode, shared room behavior, matching, accessibility, or the critical participant flow. It will route the agent to the sanitized product and architecture documents, protect consent and privacy boundaries, and require the relevant two-tab and no-match checks.

### `maintaining-87k-inference`

Use for Gemma provider, extraction, schema, prompt, timeout, repair, or provider-status work. It will preserve the typed provider contract, server-side secret boundary, evidence and uncertainty model, real-model judging policy, and honest failure behavior.

### `shipping-87k-demo`

Use for demo readiness, generated assets, public-repository checks, release verification, Cloud Run preparation, or judging rehearsal. It will distinguish preparation from external authorization, keep generated media synthetic and traceable, and route to the full verification sequence.

### `preserving-87k-lessons`

Use after a recurring failure, non-obvious decision, or useful workaround is discovered. It will decide whether the durable fix belongs in an automated test or script, `AGENTS.md`, an existing skill, or project documentation, avoiding both lost knowledge and duplicated guidance.

## Structure

Each skill will have a concise `SKILL.md` with only `name` and `description` frontmatter. Existing project documents remain authoritative and will be linked only where the task requires them. Supporting files will be added only if a skill needs substantial reference material or reusable automation; the initial set is expected to remain self-contained.

## Validation

Create and validate each skill independently:

1. Run a realistic baseline scenario without the new skill and capture the gap.
2. Write the smallest skill that corrects the observed gap.
3. Run the same scenario with the skill and check that the project constraints are applied.
4. Run the bundled skill validator.
5. Review descriptions for precise automatic discovery and check links to repository documents.

No cloud mutation, deployment, push, or pull request is part of this work. Existing unrelated asset changes remain untouched.
