import { useState, useEffect, useRef } from "react";

function PromptModal({ isOpen, onClose, onSubmit, status }) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || status === "loading") return;
    onSubmit(prompt);
    setPrompt("");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Create with AI</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="modal-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create...

e.g. 'A landing page for a coffee shop with a hero section and menu'
or 'A pricing table with 3 tiers'"
            disabled={status === "loading"}
          />

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={!prompt.trim() || status === "loading"}
            >
              {status === "loading" ? "Generating..." : "Generate"}
            </button>
          </div>

          {status === "error" && (
            <p className="modal-error">Failed to generate. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default PromptModal;
