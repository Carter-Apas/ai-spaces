import Anthropic from "@anthropic-ai/sdk";

import { config, logger } from "@/config/index.js";
import {
  GENERATOR_PROMPT,
  SAFETY_CHECK_PROMPT,
  CLASSIFIER_PROMPT,
} from "@/prompts/index.js";

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

const MODEL = "claude-sonnet-4-20250514";

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export type ContentType = "html" | "image";

export interface ClassificationResult {
  type: ContentType;
}

export const generateContent = async (prompt: string): Promise<string> => {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: GENERATOR_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
};

export const checkContentSafety = async (
  content: string
): Promise<SafetyResult> => {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: SAFETY_CHECK_PROMPT,
    messages: [{ role: "user", content: content }],
  });

  const responseContent = message.content[0];
  if (responseContent.type !== "text") {
    return { safe: false, reason: "Unexpected response type" };
  }

  const responseText = responseContent.text.trim();

  try {
    return JSON.parse(responseText) as SafetyResult;
  } catch {
    logger.warn({ responseText }, "Failed to parse safety check response");
    return { safe: false, reason: "Unable to verify safety" };
  }
};

export const classifyPrompt = async (
  prompt: string
): Promise<ClassificationResult> => {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 64,
    system: CLASSIFIER_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const responseContent = message.content[0];
  if (responseContent.type !== "text") {
    return { type: "html" }; // Default to HTML
  }

  const responseText = responseContent.text.trim();

  try {
    const result = JSON.parse(responseText) as ClassificationResult;
    if (result.type !== "html" && result.type !== "image") {
      return { type: "html" };
    }
    return result;
  } catch {
    logger.warn({ responseText }, "Failed to parse classification response");
    return { type: "html" }; // Default to HTML
  }
};
