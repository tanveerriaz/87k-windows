import { describe, expect, it } from "vitest";
import { keepExplicitConsent } from "../../src/server/inference/consent-evidence";

const MODEL_OFFERS = ["teach basic radio repair"];
const MODEL_WANTS = ["learn basic radio repair"];

describe("keepExplicitConsent", () => {
  it("keeps offers/wants for English when the raw memory has explicit phrasing", () => {
    const result = keepExplicitConsent(
      "I repaired radios in Queenstown. I would be happy to teach it, and I want to learn about old telephones too.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "en",
    );
    expect(result.offers).toEqual(MODEL_OFFERS);
    expect(result.wants).toEqual(MODEL_WANTS);
  });

  it("empties English offers/wants when the raw memory has no explicit phrasing, even if the model returned some", () => {
    const result = keepExplicitConsent(
      "I repaired radios in Queenstown in the 1970s.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "en",
    );
    expect(result.offers).toEqual([]);
    expect(result.wants).toEqual([]);
  });

  it("keeps offers/wants for zh when the raw memory has an explicit phrase", () => {
    const result = keepExplicitConsent(
      "我以前在女皇镇修理收音机。我愿意教别人，也想学一点新知识。",
      MODEL_OFFERS,
      MODEL_WANTS,
      "zh",
    );
    expect(result.offers).toEqual(MODEL_OFFERS);
    expect(result.wants).toEqual(MODEL_WANTS);
  });

  it("empties zh offers/wants when the raw memory has no curated explicit phrase, even if the model returned some", () => {
    const result = keepExplicitConsent(
      "我以前在女皇镇修理收音机，那是在1970年代。",
      MODEL_OFFERS,
      MODEL_WANTS,
      "zh",
    );
    expect(result.offers).toEqual([]);
    expect(result.wants).toEqual([]);
  });

  it("keeps offers/wants for ms when the raw memory has an explicit phrase", () => {
    const result = keepExplicitConsent(
      "Saya membaiki radio di Queenstown. Saya boleh mengajar orang lain, dan saya mahu belajar sesuatu yang baharu.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "ms",
    );
    expect(result.offers).toEqual(MODEL_OFFERS);
    expect(result.wants).toEqual(MODEL_WANTS);
  });

  it("empties ms offers/wants when the raw memory has no curated explicit phrase, even if the model returned some", () => {
    const result = keepExplicitConsent(
      "Saya membaiki radio di Queenstown pada tahun 1970-an.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "ms",
    );
    expect(result.offers).toEqual([]);
    expect(result.wants).toEqual([]);
  });

  it("keeps offers/wants for ta when the raw memory has an explicit phrase", () => {
    const result = keepExplicitConsent(
      "நான் குயின்ஸ்டவுனில் ரேடியோக்களை பழுதுபார்த்தேன். நான் கற்பிக்க தயார், நான் கற்க விரும்புகிறேன்.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "ta",
    );
    expect(result.offers).toEqual(MODEL_OFFERS);
    expect(result.wants).toEqual(MODEL_WANTS);
  });

  it("empties ta offers/wants when the raw memory has no curated explicit phrase, even if the model returned some", () => {
    const result = keepExplicitConsent(
      "நான் குயின்ஸ்டவுனில் 1970களில் ரேடியோக்களை பழுதுபார்த்தேன்.",
      MODEL_OFFERS,
      MODEL_WANTS,
      "ta",
    );
    expect(result.offers).toEqual([]);
    expect(result.wants).toEqual([]);
  });

  it("defaults to English semantics when no language is given", () => {
    const result = keepExplicitConsent("I repaired radios in Queenstown.", MODEL_OFFERS, MODEL_WANTS);
    expect(result.offers).toEqual([]);
    expect(result.wants).toEqual([]);
  });
});
