function DynamicContent({ content, loading }) {
  if (loading) {
    return (
      <div className="canvas-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Loading...
      </div>
    )
  }

  if (!content) {
    return (
      <div className="canvas-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Enter a prompt to generate content
      </div>
    )
  }

  return (
    <div
      className="canvas-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export default DynamicContent
