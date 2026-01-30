import Anthropic from "@anthropic-ai/sdk";
import { config, logger } from "../config/index.js";
import { GENERATOR_PROMPT, SAFETY_CHECK_PROMPT } from "../prompts/index.js";

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

const MODEL = "claude-sonnet-4-20250514";

export async function generateContent(prompt) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: GENERATOR_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].text;
}

export async function checkContentSafety(content) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: SAFETY_CHECK_PROMPT,
    messages: [{ role: "user", content: content }],
  });

  const responseText = message.content[0].text.trim();

  try {
    return JSON.parse(responseText);
  } catch {
    logger.warn({ responseText }, "Failed to parse safety check response");
    return { safe: false, reason: "Unable to verify safety" };
  }
}
