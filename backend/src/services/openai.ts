import OpenAI from "openai";

import { config } from "@/config/index.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface ImageGenerationResult {
  url: string;
  revisedPrompt?: string;
}

export const generateImage = async (
  prompt: string,
): Promise<ImageGenerationResult> => {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageData = response.data?.[0];

  if (!imageData?.url) {
    throw new Error("No image URL returned from DALL-E");
  }

  return {
    url: imageData.url,
    revisedPrompt: imageData.revised_prompt,
  };
};
