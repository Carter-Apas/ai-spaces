import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import PromptInput from './components/PromptInput'
import DynamicContent from './components/DynamicContent'

const DEFAULT_PAGE_SLUG = 'main'

function App() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchPage()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pages',
          filter: `slug=eq.${DEFAULT_PAGE_SLUG}`,
        },
        (payload) => {
          console.log('Real-time update:', payload)
          if (payload.new) {
            setPage(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPage() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', DEFAULT_PAGE_SLUG)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching page:', error)
    }

    setPage(data)
    setLoading(false)
  }

  async function handlePromptSubmit(prompt) {
    setStatus('loading')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, slug: DEFAULT_PAGE_SLUG }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const result = await response.json()
      if (result.page) {
        setPage(result.page)
      }

      setStatus('success')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Prompt Page</h1>
      </header>

      <main className="main">
        <aside className="sidebar">
          <h2>Modify Page</h2>
          <PromptInput onSubmit={handlePromptSubmit} status={status} />
        </aside>

        <div className="canvas-container">
          <div className="canvas">
            <DynamicContent content={page?.content} loading={loading} generating={status === 'loading'} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
