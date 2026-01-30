import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import DOMPurify from 'isomorphic-dompurify'
import pino from 'pino'
import pinoHttp from 'pino-http'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino/file',
    options: { destination: 1 }
  } : undefined,
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(pinoHttp({ logger }))

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const SYSTEM_PROMPT = `You are an HTML/CSS generator. The user will describe what they want on a webpage, and you generate ONLY the HTML and CSS to create it.

Rules:
- Return ONLY valid HTML with inline styles or a <style> tag
- Do NOT include <html>, <head>, <body>, or <script> tags
- Make it visually appealing with modern styling
- Use a clean, professional design aesthetic
- Ensure the content fills the container appropriately
- Do NOT include any explanation, just the HTML/CSS code
- Do NOT wrap the code in markdown code blocks

Example user prompt: "A blue button that says Click Me"
Example response: <button style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Click Me</button>`

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, slug } = req.body

    if (!prompt || !slug) {
      return res.status(400).json({ error: 'Missing prompt or slug' })
    }

    // Get current content for context
    const { data: currentPage } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', slug)
      .single()

    const contextPrompt = currentPage?.content
      ? `Current page HTML:\n${currentPage.content}\n\nUser wants to modify it: ${prompt}`
      : prompt

    // Generate new content with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
    })

    const generatedContent = message.content[0].text

    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(generatedContent, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'button', 'input', 'form',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
        'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
        'label', 'select', 'option', 'textarea',
        'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
        'style'
      ],
      ALLOWED_ATTR: [
        'style', 'class', 'id', 'href', 'src', 'alt', 'title',
        'type', 'name', 'value', 'placeholder', 'disabled', 'readonly',
        'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width',
        'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points',
        'for', 'rows', 'cols', 'target', 'rel'
      ],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
    })

    // Upsert to database
    const { data, error } = await supabase
      .from('pages')
      .upsert(
        {
          slug,
          content: sanitizedContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) {
      logger.error({ err: error, slug }, 'Supabase upsert failed')
      return res.status(500).json({ error: 'Failed to save content' })
    }

    logger.info({ slug, contentLength: sanitizedContent.length }, 'Page generated successfully')

    res.json({ success: true, page: data })
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate content')
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})
