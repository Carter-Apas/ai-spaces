import { Router, Request, Response } from "express";

import { randomUUID } from "crypto";

import { logger } from "@/config/index.js";
import {
  generateContent,
  checkContentSafety,
  sanitizeContent,
  upsertPage,
  classifyPrompt,
  generateImage,
  uploadImageFromUrl,
} from "@/services/index.js";

const generateRouter = Router();

interface GenerateRequestBody {
  prompt: string;
  slug: string;
}

generateRouter.post(
  "/",
  async (req: Request<object, object, GenerateRequestBody>, res: Response) => {
    try {
      const { prompt, slug } = req.body;

      logger.info({ prompt, slug }, "Generate request received");

      if (!prompt || !slug) {
        res.status(400).json({ error: "Missing prompt or slug" });
        return;
      }

      // Classify the prompt to determine if it's HTML or image
      logger.info({ slug }, "Classifying prompt");
      const classification = await classifyPrompt(prompt);
      logger.info({ slug, type: classification.type }, "Prompt classified");

      if (classification.type === "image") {
        // Generate image with DALL-E
        logger.info({ slug }, "Generating image with DALL-E");
        const imageResult = await generateImage(prompt);

        // Upload to Supabase Storage
        const filename = `${slug}/${randomUUID()}.png`;
        logger.info({ slug, filename }, "Uploading image to storage");
        const publicUrl = await uploadImageFromUrl(imageResult.url, filename);

        // Save to database
        const page = await upsertPage(slug, publicUrl, "image");
        logger.info(
          { slug, imageUrl: publicUrl },
          "Image generated successfully",
        );

        res.json({ success: true, page });
      } else {
        // Generate HTML content with Claude
        const generatedContent = await generateContent(prompt);

        // Check content safety
        logger.info({ slug }, "Running safety check on generated content");
        const safetyResult = await checkContentSafety(generatedContent);

        if (!safetyResult.safe) {
          logger.warn(
            { slug, reason: safetyResult.reason },
            "Content failed safety check",
          );
          res.status(400).json({
            error: "Generated content failed safety check",
            reason: safetyResult.reason,
          });
          return;
        }

        logger.info({ slug }, "Content passed safety check");

        // Sanitize content
        const { sanitized, scriptCount } = sanitizeContent(generatedContent);
        logger.info({ slug, scriptCount }, "Content sanitized");

        // Save to database
        const page = await upsertPage(slug, sanitized, "html");
        logger.info(
          { slug, contentLength: sanitized.length },
          "Page generated successfully",
        );

        res.json({ success: true, page });
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to generate content");
      res.status(500).json({ error: "Failed to generate content" });
    }
  },
);

export { generateRouter };
