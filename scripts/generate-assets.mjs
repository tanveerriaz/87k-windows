/* global Buffer, console, process */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required in the current shell. Never commit it.");
}

const model = process.env.NANO_BANANA_MODEL?.trim() || "gemini-3.1-flash-image";
const root = process.cwd();
const promptDirectory = resolve(root, "assets/prompts");
const outputDirectory = resolve(root, "assets/generated");
const promptFiles = ["hdb-facade.md", "memory-objects.md", "submission-thumbnail.md"];
const ai = new GoogleGenAI({ apiKey });
const generated = [];

await mkdir(outputDirectory, { recursive: true });

for (const promptFile of promptFiles) {
  const prompt = (await readFile(join(promptDirectory, promptFile), "utf8")).trim();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image was returned for ${promptFile}. Check model access and quota.`);
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const extension = mimeType === "image/jpeg" ? ".jpg" : ".png";
  const outputName = `${basename(promptFile, extname(promptFile))}${extension}`;
  const bytes = Buffer.from(imagePart.inlineData.data, "base64");
  await writeFile(join(outputDirectory, outputName), bytes);
  generated.push({
    file: `assets/generated/${outputName}`,
    prompt: `assets/prompts/${promptFile}`,
    model,
    mimeType,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    generatedAt: new Date().toISOString(),
  });
  console.info(`Generated ${outputName}`);
}

await writeFile(
  resolve(root, "assets/manifest.json"),
  `${JSON.stringify({ generated, policy: "Fictional, non-identifying build-time assets only. Review before moving an output into public/generated/." }, null, 2)}\n`,
);
