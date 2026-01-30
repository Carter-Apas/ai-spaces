import { useState } from "react";

function PromptInput({ onSubmit, status }) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || status === "loading") return;
    onSubmit(prompt);
    setPrompt("");
  }

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <textarea
        className="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe how to change the page...

e.g. 'Add a blue header that says Welcome' or 'Create a grid of 3 cards with product info'"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className="submit-btn"
        disabled={!prompt.trim() || status === "loading"}
      >
        {status === "loading" ? "Generating..." : "Generate"}
      </button>
      {status === "error" && (
        <p className="status error">Failed to generate. Try again.</p>
      )}
    </form>
  );
}

export default PromptInput;
