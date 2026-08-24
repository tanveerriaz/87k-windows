import type { Language, SeniorBridge } from "../../shared/schemas";
import { SeniorBridgeSchema } from "../../shared/schemas";
import type { ConnectionFacilitator, FacilitationInput } from "./provider";

type GuideTemplate = {
  introduction: string;
  questions: [string, string];
  consentReminder: string;
};

// TRANSLATION REVIEW: machine-drafted, needs native check.
// Mock-only guide templates (no model call). {topic} is a canonical-English
// skill/interest value (Task 4) and is interpolated as-is, same pattern as
// src/client/lib/match-why.ts.
const GUIDE_TEMPLATES: Record<Language, GuideTemplate> = {
  en: {
    introduction: "You both have a {topic} story to explore.",
    questions: [
      "Would you like to share what made {topic} memorable?",
      "Would you like to hear what the other person hopes to learn?",
    ],
    consentReminder: "Either person may pause or stop at any time.",
  },
  zh: {
    introduction: "你们都有一个关于{topic}的故事可以探索。",
    questions: [
      "你愿意分享是什么让{topic}变得难忘吗？",
      "你想听听对方希望学到什么吗？",
    ],
    consentReminder: "任何一方都可以随时暂停或停止。",
  },
  ms: {
    introduction: "Anda berdua mempunyai cerita tentang {topic} untuk diterokai.",
    questions: [
      "Adakah anda ingin berkongsi apa yang menjadikan {topic} tidak dapat dilupakan?",
      "Adakah anda ingin mendengar apa yang diharapkan oleh orang lain untuk dipelajari?",
    ],
    consentReminder: "Sesiapa boleh berhenti seketika atau berhenti pada bila-bila masa.",
  },
  ta: {
    introduction: "உங்கள் இருவருக்கும் {topic} பற்றிய ஒரு கதை ஆராய உள்ளது.",
    questions: [
      "{topic}-ஐ மறக்கமுடியாததாக ஆக்கியது என்ன என்பதைப் பகிர விரும்புகிறீர்களா?",
      "மற்றவர் என்ன கற்க விரும்புகிறார் என்பதைக் கேட்க விரும்புகிறீர்களா?",
    ],
    consentReminder: "யாரும் எப்போது வேண்டுமானாலும் இடைநிறுத்தலாம் அல்லது நிறுத்தலாம்.",
  },
};

function fillTopic(template: GuideTemplate, topic: string): { introduction: string; questions: [string, string] } {
  const fill = (text: string) => text.split("{topic}").join(topic);
  return {
    introduction: fill(template.introduction),
    questions: [fill(template.questions[0]), fill(template.questions[1])],
  };
}

export class MockFacilitator implements ConnectionFacilitator {
  readonly mode = "mock" as const;

  async createGuide(input: FacilitationInput): Promise<SeniorBridge> {
    const topic = input.source.skills[0] ?? input.source.interests[0] ?? "this shared memory";
    const language = input.source.language;
    const template = GUIDE_TEMPLATES[language];
    const needsEnglishFallback = input.source.language !== input.candidate.language;
    return SeniorBridgeSchema.parse({
      language,
      ...fillTopic(template, topic),
      consentReminder: template.consentReminder,
      englishFallback: needsEnglishFallback ? fillTopic(GUIDE_TEMPLATES.en, topic) : undefined,
    });
  }
}
