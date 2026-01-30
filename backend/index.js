import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors())
app.use(express.json())

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

    // Upsert to database
    const { data, error } = await supabase
      .from('pages')
      .upsert(
        {
          slug,
          content: generatedContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to save content' })
    }

    res.json({ success: true, page: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
