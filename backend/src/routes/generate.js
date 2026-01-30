import { Router } from "express";
import { logger } from "../config/index.js";
import {
  generateContent,
  checkContentSafety,
  sanitizeContent,
  upsertPage,
} from "../services/index.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { prompt, slug } = req.body;

    logger.info({ prompt, slug }, "Generate request received");

    if (!prompt || !slug) {
      return res.status(400).json({ error: "Missing prompt or slug" });
    }

    // Generate content with Claude
    const generatedContent = await generateContent(prompt);

    // Check content safety
    logger.info({ slug }, "Running safety check on generated content");
    const safetyResult = await checkContentSafety(generatedContent);

    if (!safetyResult.safe) {
      logger.warn({ slug, reason: safetyResult.reason }, "Content failed safety check");
      return res.status(400).json({
        error: "Generated content failed safety check",
        reason: safetyResult.reason,
      });
    }

    logger.info({ slug }, "Content passed safety check");

    // Sanitize content
    const { sanitized, scriptCount } = sanitizeContent(generatedContent);
    logger.info({ slug, scriptCount }, "Content sanitized");

    // Save to database
    const page = await upsertPage(slug, sanitized);
    logger.info({ slug, contentLength: sanitized.length }, "Page generated successfully");

    res.json({ success: true, page });
  } catch (error) {
    logger.error({ err: error }, "Failed to generate content");
    res.status(500).json({ error: "Failed to generate content" });
  }
});

export default router;
