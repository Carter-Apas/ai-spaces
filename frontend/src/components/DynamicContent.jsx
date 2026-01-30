function DynamicContent({ content, loading, generating }) {
  if (loading) {
    return (
      <div className="canvas-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Loading...
      </div>
    )
  }

  if (!content) {
    return (
      <div className="canvas-content canvas-content--empty">
        {generating ? (
          <div className="spinner-container">
            <div className="spinner" />
            <span>Generating...</span>
          </div>
        ) : (
          <span>Enter a prompt to generate content</span>
        )}
      </div>
    )
  }

  return (
    <div className="canvas-content-wrapper">
      {generating && (
        <div className="spinner-overlay">
          <div className="spinner" />
          <span>Generating...</span>
        </div>
      )}
      <div
        className="canvas-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

export default DynamicContent
