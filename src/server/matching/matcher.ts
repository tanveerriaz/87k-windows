import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import MiniSearch from "minisearch";
import { MatchResultSchema, StoryCapsuleSchema, type MatchResult, type StoryCapsule } from "../../shared/schemas";

type IndexedStory = { id: string; searchText: string };

const STOP_WORDS = new Set(["a", "an", "and", "basic", "in", "of", "share", "the", "to"]);

function terms(values: string[]): Set<string> {
  return new Set(
    values
      .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/))
      .filter((value) => value.length > 2 && !STOP_WORDS.has(value)),
  );
}

function intersects(first: string[], second: string[]): boolean {
  const left = terms(first);
  return [...terms(second)].some((term) => left.has(term));
}

function normalize(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function storySearchText(story: StoryCapsule): string {
  return [
    story.place,
    story.era,
    ...story.skills,
    ...story.interests,
    ...story.offers,
    ...story.wants,
  ]
    .filter(Boolean)
    .join(" ");
}

export function loadSyntheticStories(): StoryCapsule[] {
  const file = resolve(process.cwd(), "data/synthetic-stories.json");
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  return StoryCapsuleSchema.array().parse(parsed);
}

export type RankedCandidate = {
  story: StoryCapsule;
  score: number;
  evidencePath: string[];
};

export class StoryMatcher {
  private readonly storiesById: Map<string, StoryCapsule>;
  private readonly index: MiniSearch<IndexedStory>;

  constructor(
    stories: StoryCapsule[] = loadSyntheticStories(),
    private readonly threshold = 0.62,
  ) {
    this.storiesById = new Map(stories.map((story) => [story.id, story]));
    this.index = new MiniSearch<IndexedStory>({ fields: ["searchText"], storeFields: ["id"] });
    this.index.addAll(stories.map((story) => ({ id: story.id, searchText: storySearchText(story) })));
  }

  topThree(capsule: StoryCapsule): StoryCapsule[] {
    const query = storySearchText(capsule);
    if (!query.trim()) return [];
    return this.index
      .search(query, { combineWith: "OR", fuzzy: 0.2, prefix: true })
      .slice(0, 3)
      .map((result) => this.storiesById.get(String(result.id)))
      .filter((story): story is StoryCapsule => Boolean(story));
  }

  score(capsule: StoryCapsule, candidate: StoryCapsule): RankedCandidate {
    const evidencePath: string[] = [];
    let score = 0;

    if (normalize(capsule.place) && normalize(capsule.place) === normalize(candidate.place)) {
      score += 0.35;
      evidencePath.push(capsule.place as string);
    }

    if (
      intersects(
        [...capsule.skills, ...capsule.interests],
        [...candidate.skills, ...candidate.interests, ...candidate.wants],
      )
    ) {
      score += 0.25;
      evidencePath.push(capsule.skills[0] ?? capsule.interests[0] ?? "shared interest");
    }

    if (normalize(capsule.era) && normalize(capsule.era) === normalize(candidate.era)) {
      score += 0.2;
      evidencePath.splice(Math.min(1, evidencePath.length), 0, capsule.era as string);
    }

    if (
      intersects(capsule.offers, candidate.wants) ||
      intersects(capsule.wants, candidate.offers)
    ) {
      score += 0.2;
      evidencePath.push("teach ↔ learn");
    }

    return { story: candidate, score: Number(score.toFixed(2)), evidencePath };
  }

  match(capsule: StoryCapsule): MatchResult {
    const ranked = this.topThree(capsule)
      .map((candidate) => this.score(capsule, candidate))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];

    if (!best || best.score < this.threshold) {
      return MatchResultSchema.parse({
        decision: "NO_MATCH",
        candidateId: null,
        confidence: best?.score ?? 0,
        evidencePath: [],
        why: "The prepared stories do not contain enough shared and complementary evidence yet.",
        invitation: null,
        scene: null,
      });
    }

    const skill = capsule.skills[0] ?? capsule.interests[0] ?? "a shared interest";
    const hasComplement = best.evidencePath.includes("teach ↔ learn");
    const why = hasComplement
      ? `You both connect through ${capsule.place ?? "a place"} and ${skill}. One knows how; the other wants to learn.`
      : `Both fictional stories connect through ${capsule.place ?? "a place"}, ${capsule.era ?? "a shared era"} and ${skill}.`;
    return MatchResultSchema.parse({
      decision: "MATCH",
      candidateId: best.story.id,
      confidence: best.score,
      evidencePath: best.evidencePath,
      why,
      invitation: "Kopi and a radio repair story?",
      scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
    });
  }

  matchPair(source: StoryCapsule, candidate: StoryCapsule, sourceParticipantId: string, candidateParticipantId: string): MatchResult {
    const ranked = this.score(source, candidate);
    if (ranked.score < this.threshold) {
      return MatchResultSchema.parse({
        decision: "NO_MATCH",
        candidateId: null,
        confidence: ranked.score,
        evidencePath: [],
        why: "These two approved memories do not contain enough shared and complementary evidence yet.",
        invitation: null,
        scene: null,
      });
    }
    const skill = source.skills[0] ?? source.interests[0] ?? "a shared interest";
    const hasComplement = ranked.evidencePath.includes("teach ↔ learn");
    return MatchResultSchema.parse({
      decision: "MATCH",
      candidateId: candidateParticipantId,
      confidence: ranked.score,
      evidencePath: ranked.evidencePath,
      why: hasComplement
        ? `These memories connect through ${source.place ?? "a place"} and ${skill}. One person offered to share; the other asked to learn.`
        : `These memories connect through ${source.place ?? "a place"}, ${source.era ?? "a shared era"} and ${skill}.`,
      invitation: "Would you both like to listen and continue this story together?",
      scene: { fromWindow: 27, toWindow: 64, colour: "amber" },
    });
  }

  getStory(id: string): StoryCapsule | undefined {
    return this.storiesById.get(id);
  }
}
