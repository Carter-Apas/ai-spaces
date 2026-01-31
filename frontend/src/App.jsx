import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import PromptModal from "./components/PromptModal";
import DynamicContent from "./components/DynamicContent";

function App() {
  const [canvases, setCanvases] = useState([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState(1);
  const [status, setStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const updateCanvasPage = useCallback((slug, pageData) => {
    setCanvases((prev) => {
      const exists = prev.some((canvas) => canvas.slug === slug);
      if (exists) {
        return prev.map((canvas) =>
          canvas.slug === slug
            ? { ...canvas, page: pageData, loading: false }
            : canvas
        );
      } else {
        // Add new canvas if it doesn't exist (from real-time update)
        const idMatch = slug.match(/canvas-(\d+)/);
        const id = idMatch ? parseInt(idMatch[1], 10) : prev.length + 1;
        return [...prev, { id, slug, page: pageData, loading: false }];
      }
    });
  }, []);

  useEffect(() => {
    // Fetch all canvas pages from database
    async function fetchAllPages() {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .like("slug", "canvas-%")
        .order("slug", { ascending: true });

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching pages:", error);
      }

      // Build canvases from existing data
      const existingCanvases = (data || []).map((page) => {
        const idMatch = page.slug.match(/canvas-(\d+)/);
        const id = idMatch ? parseInt(idMatch[1], 10) : 1;
        return { id, slug: page.slug, page, loading: false };
      });

      // Ensure we have at least 4 canvases
      const maxId = existingCanvases.length > 0
        ? Math.max(...existingCanvases.map((c) => c.id))
        : 0;

      const allCanvases = [...existingCanvases];
      for (let i = 1; i <= Math.max(4, maxId); i++) {
        if (!allCanvases.some((c) => c.id === i)) {
          allCanvases.push({ id: i, slug: `canvas-${i}`, page: null, loading: false });
        }
      }

      // Sort by id
      allCanvases.sort((a, b) => a.id - b.id);

      setCanvases(allCanvases);
      setInitialLoading(false);
    }

    fetchAllPages();

    // Subscribe to real-time updates for all canvases
    const channel = supabase
      .channel("pages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          if (payload.new && payload.new.slug) {
            updateCanvasPage(payload.new.slug, payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateCanvasPage]);

  async function handlePromptSubmit(prompt) {
    const selectedCanvas = canvases.find((c) => c.id === selectedCanvasId);
    if (!selectedCanvas) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, slug: selectedCanvas.slug }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const result = await response.json();
      if (result.page) {
        updateCanvasPage(selectedCanvas.slug, result.page);
      }

      setStatus("success");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
    }
  }

  const handleModalSubmit = (prompt) => {
    setIsModalOpen(false);
    handlePromptSubmit(prompt);
  };

  const handleCanvasClick = (canvasId) => {
    setSelectedCanvasId(canvasId);
  };

  const addCanvas = () => {
    const newId = canvases.length > 0 ? Math.max(...canvases.map((c) => c.id)) + 1 : 1;
    setCanvases((prev) => [
      ...prev,
      { id: newId, slug: `canvas-${newId}`, page: null, loading: false },
    ]);
    setSelectedCanvasId(newId);
  };

  const removeCanvas = (canvasId, e) => {
    e.stopPropagation();
    if (canvases.length <= 1) return;

    setCanvases((prev) => prev.filter((c) => c.id !== canvasId));
    if (selectedCanvasId === canvasId) {
      const remaining = canvases.filter((c) => c.id !== canvasId);
      setSelectedCanvasId(remaining[0]?.id);
    }
  };

  if (initialLoading) {
    return (
      <div className="app">
        <main className="main">
          <div className="loading-container">
            <div className="spinner" />
            <span>Loading canvases...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="main">
        <div className="canvas-grid">
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`canvas-wrapper ${
                selectedCanvasId === canvas.id ? "canvas-wrapper--selected" : ""
              }`}
              onClick={() => handleCanvasClick(canvas.id)}
            >
              <div className="canvas-header">
                <span className="canvas-label">Canvas {canvas.id}</span>
                {canvases.length > 1 && (
                  <button
                    className="canvas-remove"
                    onClick={(e) => removeCanvas(canvas.id, e)}
                    title="Remove canvas"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="canvas">
                <DynamicContent
                  content={canvas.page?.content}
                  contentType={canvas.page?.content_type || "html"}
                  loading={canvas.loading}
                  generating={
                    status === "loading" && selectedCanvasId === canvas.id
                  }
                />
              </div>
            </div>
          ))}
          <button className="canvas-add" onClick={addCanvas} title="Add canvas">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Canvas</span>
          </button>
        </div>
      </main>

      <button
        className="fab"
        onClick={() => setIsModalOpen(true)}
        disabled={status === "loading"}
        title="Create with AI"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <PromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        status={status}
        selectedCanvasId={selectedCanvasId}
      />
    </div>
  );
}

export default App;
