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

  // QA report F1 (docs/superpowers/plans/2026-08-23-multilingual-qa.md):
  // 12 probes, each asserting the QA-stated expected outcome. 6 leaked
  // before this fix (offer/want incorrectly kept); 4 held already
  // (en/ms negate in a way their phrase patterns don't survive); 2 are
  // positive controls confirming the fix didn't also break genuine consent.
  describe("F1 negation probes", () => {
    it("en: 'I cannot teach anyone.' already held — offer rejected", () => {
      const result = keepExplicitConsent("I cannot teach anyone.", MODEL_OFFERS, MODEL_WANTS, "en");
      expect(result.offers).toEqual([]);
    });

    it("en: 'I would not like to continue.' already held — want rejected", () => {
      const result = keepExplicitConsent("I would not like to continue.", MODEL_OFFERS, MODEL_WANTS, "en");
      expect(result.wants).toEqual([]);
    });

    it("ms: 'saya tidak sudi mengajar.' already held — offer rejected", () => {
      const result = keepExplicitConsent("saya tidak sudi mengajar.", MODEL_OFFERS, MODEL_WANTS, "ms");
      expect(result.offers).toEqual([]);
    });

    it("ms: 'saya tidak mahu belajar.' already held — want rejected", () => {
      const result = keepExplicitConsent("saya tidak mahu belajar.", MODEL_OFFERS, MODEL_WANTS, "ms");
      expect(result.wants).toEqual([]);
    });

    it("zh: '我不愿意教别人。' (I am NOT willing to teach) — offer rejected", () => {
      const result = keepExplicitConsent("我不愿意教别人。", MODEL_OFFERS, MODEL_WANTS, "zh");
      expect(result.offers).toEqual([]);
    });

    it("zh: '我不想学。' (I do NOT want to learn) — want rejected", () => {
      const result = keepExplicitConsent("我不想学。", MODEL_OFFERS, MODEL_WANTS, "zh");
      expect(result.wants).toEqual([]);
    });

    it("zh: '我想那是1970年代。' (I THINK that was the 1970s — 我想 ≠ want here) — want rejected", () => {
      const result = keepExplicitConsent("我想那是1970年代。", MODEL_OFFERS, MODEL_WANTS, "zh");
      expect(result.wants).toEqual([]);
    });

    it("zh: '我希望他好。' (I hope HE is well — not a wish to connect) — want rejected", () => {
      const result = keepExplicitConsent("我希望他好。", MODEL_OFFERS, MODEL_WANTS, "zh");
      expect(result.wants).toEqual([]);
    });

    it("ta: 'நான் உதவ முடியும் என்று நினைக்கவில்லை.' (I do NOT think I can help) — offer rejected", () => {
      const result = keepExplicitConsent("நான் உதவ முடியும் என்று நினைக்கவில்லை.", MODEL_OFFERS, MODEL_WANTS, "ta");
      expect(result.offers).toEqual([]);
    });

    it("ta: 'நான் விரும்புகிறேன் என்று சொல்லவில்லை.' (I did NOT say I want to) — want rejected", () => {
      const result = keepExplicitConsent("நான் விரும்புகிறேன் என்று சொல்லவில்லை.", MODEL_OFFERS, MODEL_WANTS, "ta");
      expect(result.wants).toEqual([]);
    });

    it("zh positive control: genuine unnegated 我愿意 still keeps the offer", () => {
      const result = keepExplicitConsent("我愿意教别人基本的收音机维修。", MODEL_OFFERS, MODEL_WANTS, "zh");
      expect(result.offers).toEqual(MODEL_OFFERS);
    });

    it("ta positive control: genuine unnegated விரும்புகிறேன் still keeps the want", () => {
      const result = keepExplicitConsent("நான் கற்க விரும்புகிறேன். பழைய ரேடியோக்களை பழுதுபார்க்க விரும்புகிறேன்.", MODEL_OFFERS, MODEL_WANTS, "ta");
      expect(result.wants).toEqual(MODEL_WANTS);
    });
  });
});
