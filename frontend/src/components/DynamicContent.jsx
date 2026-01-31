import { useEffect, useRef } from "react";

function DynamicContent({
  content,
  contentType = "html",
  loading,
  generating,
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current || !content || contentType !== "html") return;

    // Find all script tags in the content
    const scripts = contentRef.current.querySelectorAll("script");

    scripts.forEach((oldScript) => {
      // Create a new script element to trigger execution
      const newScript = document.createElement("script");

      // Copy all attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy the script content
      newScript.textContent = oldScript.textContent;

      // Replace the old script with the new one to trigger execution
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }, [content, contentType]);

  if (loading) {
    return (
      <div
        className="canvas-content"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
        }}
      >
        Loading...
      </div>
    );
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
          <span>Select this canvas and click + to create</span>
        )}
      </div>
    );
  }

  // Render image content
  if (contentType === "image") {
    return (
      <div className="canvas-content-wrapper">
        {generating && (
          <div className="spinner-overlay">
            <div className="spinner" />
            <span>Generating...</span>
          </div>
        )}
        <div className="canvas-content canvas-content--image">
          <img src={content} alt="Generated content" />
        </div>
      </div>
    );
  }

  // Render HTML content
  return (
    <div className="canvas-content-wrapper">
      {generating && (
        <div className="spinner-overlay">
          <div className="spinner" />
          <span>Generating...</span>
        </div>
      )}
      <div
        ref={contentRef}
        className="canvas-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

export default DynamicContent;
