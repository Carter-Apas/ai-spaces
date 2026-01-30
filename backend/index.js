import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import DOMPurify from "isomorphic-dompurify";
import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
        target: "pino/file",
        options: { destination: 1 },
      }
      : undefined,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const SYSTEM_PROMPT = `You are an HTML/CSS/JavaScript generator. The user will describe what they want on a webpage, and you generate ONLY the HTML, CSS, and JavaScript to create it.

IMPORTANT: Your content will be embedded inside a container div, NOT a full HTML page.

Rules:
- Wrap ALL content in a single root <div> with its own background color/style
- Use inline styles OR scoped CSS with specific class names (NOT body, html, or * selectors)
- The root div should have: width: 100%, min-height: 100%, and its own background
- Use <script> tags for any dynamic or interactive functionality
- For timers, countdowns, clocks, or anything that updates over time, you MUST use JavaScript with setInterval/setTimeout
- For user interactions beyond simple CSS hover states, use JavaScript event listeners
- Do NOT include <html>, <head>, or <body> tags
- Do NOT use CSS selectors like "body", "html", or "*" - they won't work in an embedded context
- Make it visually appealing with modern styling
- Do NOT include any explanation, just the HTML/CSS/JS code
- Do NOT wrap the code in markdown code blocks

Example user prompt: "A counter that counts up every second"
Example response:
<div style="width: 100%; min-height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;">
  <div id="counter" style="font-size: 72px; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">0</div>
</div>
<script>
let count = 0;
setInterval(() => {
  count++;
  document.getElementById('counter').textContent = count;
}, 1000);
</script>`;

const SAFETY_CHECK_PROMPT = `You are a security reviewer. Analyze the following HTML/CSS/JavaScript code and determine if it is SAFE or UNSAFE.

UNSAFE code includes:
- Attempts to steal data (cookies, localStorage, form data exfiltration)
- Requests to external URLs for malicious purposes (data exfiltration, loading remote scripts)
- Cryptocurrency mining scripts
- Keyloggers or input monitoring that sends data externally
- Attempts to redirect users to malicious sites
- Code that tries to escape its container or access parent frames maliciously
- Obfuscated code designed to hide malicious intent
- Code that attempts to download or execute external malicious payloads

SAFE code includes:
- Visual animations and effects
- Form handling that stays within the page
- Local interactivity (buttons, toggles, calculators)
- Fetching data from public APIs for display purposes (weather, quotes, etc.)
- Local storage for user preferences within the app
- Standard UI/UX interactions

Respond with ONLY a JSON object in this exact format:
{"safe": true} or {"safe": false, "reason": "brief explanation"}

Do not include any other text, markdown, or explanation outside the JSON.`;

async function checkContentSafety(content) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
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

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, slug } = req.body;

    logger.info(`request received ${prompt}`);

    if (!prompt || !slug) {
      return res.status(400).json({ error: "Missing prompt or slug" });
    }

    // Generate new content with Claude (full replacement, no context from old content)
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const generatedContent = message.content[0].text;

    // Check content safety with LLM
    logger.info({ slug }, "Running safety check on generated content");
    const safetyResult = await checkContentSafety(generatedContent);

    if (!safetyResult.safe) {
      logger.warn(
        { slug, reason: safetyResult.reason },
        "Content failed safety check",
      );
      return res.status(400).json({
        error: "Generated content failed safety check",
        reason: safetyResult.reason,
      });
    }

    logger.info({ slug }, "Content passed safety check");

    // Extract scripts before DOMPurify (DOMPurify strips script content internally)
    const scripts = [];
    const contentWithoutScripts = generatedContent.replace(
      /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
      (match) => {
        scripts.push(match);
        return ""; // Remove scripts, we'll append them at the end
      },
    );

    // Sanitize HTML without scripts
    let sanitizedContent = DOMPurify.sanitize(contentWithoutScripts, {
      ALLOWED_TAGS: [
        "div",
        "span",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "button",
        "input",
        "form",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "header",
        "footer",
        "nav",
        "main",
        "section",
        "article",
        "aside",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "br",
        "hr",
        "label",
        "select",
        "option",
        "textarea",
        "svg",
        "path",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "style",
      ],
      ALLOWED_ATTR: [
        "style",
        "class",
        "id",
        "href",
        "src",
        "alt",
        "title",
        "type",
        "name",
        "value",
        "placeholder",
        "disabled",
        "readonly",
        "width",
        "height",
        "viewBox",
        "fill",
        "stroke",
        "stroke-width",
        "d",
        "cx",
        "cy",
        "r",
        "x",
        "y",
        "x1",
        "y1",
        "x2",
        "y2",
        "points",
        "for",
        "rows",
        "cols",
        "target",
        "rel",
      ],
      FORBID_TAGS: ["iframe", "object", "embed"],
    });

    // Append scripts at the end (already verified by LLM safety check)
    if (scripts.length > 0) {
      sanitizedContent = sanitizedContent + "\n" + scripts.join("\n");
    }

    logger.info(
      { slug, scriptCount: scripts.length },
      "Appended scripts after sanitization",
    );

    // Upsert to database
    const { data, error } = await supabase
      .from("pages")
      .upsert(
        {
          slug,
          content: sanitizedContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();

    if (error) {
      logger.error({ err: error, slug }, "Supabase upsert failed");
      return res.status(500).json({ error: "Failed to save content" });
    }

    logger.info(
      { slug, contentLength: sanitizedContent.length },
      "Page generated successfully",
    );

    res.json({ success: true, page: data });
  } catch (error) {
    logger.error({ err: error }, "Failed to generate content");
    res.status(500).json({ error: "Failed to generate content" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});
