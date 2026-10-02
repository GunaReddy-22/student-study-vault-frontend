import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import "./NoteModal.css";
import HandwritingCanvas from "./HandwritingCanvas";
import FormattedAIResponse from "./FormattedAIResponse";

export default function NoteModal({ note, close, refresh }) {
  const [form, setForm] = useState({
    subject: note?.subject || "",
    title: note?.title || "",
    content: note?.content || "",
    isPublic: note?.isPublic || false,
    isPremium: note?.isPremium || false,
    price: note?.price || "",
  });

  const [handwritingMode, setHandwritingMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ AI STATES
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // ✅ AI Summarize Function
  const summarizeNote = async () => {
    if (!form.content || typeof form.content !== "string" || !form.content.trim()) {
      alert("Please enter note content before summarizing");
      return;
    }

    try {
      setLoadingAI(true);
      const res = await api.post("/ai/summarize", {
        content: form.content,
      });

      if (res.data?.summary) {
        setSummary(res.data.summary);
      } else {
        alert("No summary was returned by AI");
      }
    } catch (err) {
      console.error("AI Summarize error:", err);
      alert("AI Summary failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingAI(false);
    }
  };

  const saveNote = async () => {
    if (!form.content) {
      alert("Please add content or handwriting before saving");
      return;
    }

    if (form.isPremium && (!form.price || form.price < 1)) {
      alert("Premium notes must have a price greater than 0");
      return;
    }

    try {
      setIsSaving(true);
      if (note) {
        await api.put(`/notes/${note._id}`, form);
      } else {
        await api.post("/notes", form);
      }

      refresh();
      close();
    } catch (_) {
      alert("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
  }, [isFullscreen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const isImageContent = (content) => {
    if (!content || typeof content !== "string") return false;
    const trimmed = content.trim();
    return (
      trimmed.startsWith("data:image") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.includes("cloudinary.com") ||
      trimmed.includes("/uploads/") ||
      /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(trimmed)
    );
  };

  if (handwritingMode) {
    return (
      <HandwritingCanvas
        initialImage={isImageContent(form.content) ? form.content : null}
        onSave={(img) => {
          setForm((p) => ({ ...p, content: img }));
          setHandwritingMode(false);
        }}
        onClose={() => setHandwritingMode(false)}
      />
    );
  }

  return createPortal(
    <div className="modal-overlay">
      <div
        className={`modal-card ${isFullscreen ? "fullscreen" : ""}`}
      >
        <h3>
          {note ? "Edit Note" : "Add New Note"}
        </h3>

        <button
          className="expand-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? "✖ Close" : "<> Editor"}
        </button>

        {/* METADATA FIELDS */}
        <input
          placeholder="Subject (e.g., Computer Science, Mathematics)"
          value={form.subject}
          onChange={(e) =>
            setForm({ ...form, subject: e.target.value })
          }
        />

        <input
          placeholder="Note Title (e.g., Dijkstra Algorithm, Maxwell Equations)"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        {/* PUBLIC */}
        <div className="toggle-row">
          <label className="switch">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) =>
                setForm({ ...form, isPublic: e.target.checked })
              }
            />
            <span className="slider" />
          </label>
          <div>
            <span>Make this note public 🌍</span>
            <small>Visible to all logged-in students</small>
          </div>
        </div>

        {/* PREMIUM */}
        <div className="toggle-row">
          <label className="switch">
            <input
              type="checkbox"
              checked={form.isPremium}
              onChange={(e) =>
                setForm({
                  ...form,
                  isPremium: e.target.checked,
                  price: e.target.checked ? form.price : "",
                })
              }
            />
            <span className="slider" />
          </label>
          <div>
            <span>Make this note premium 💰</span>
            <small>Users must pay to unlock</small>
          </div>
        </div>

        {form.isPremium && (
          <input
            type="number"
            min="1"
            placeholder="Price (₹)"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
          />
        )}

        {/* CONTENT */}
        {(() => {
          const isImage =
            form.content &&
            (form.content.startsWith("data:image") ||
              form.content.startsWith("http://") ||
              form.content.startsWith("https://") ||
              form.content.includes("cloudinary.com") ||
              form.content.includes("/uploads/") ||
              /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(form.content.trim()));

          if (isImage) {
            return (
              <div className="image-preview" style={{ position: "relative", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6ee7b7", fontWeight: "600" }}>
                    ✍️ Handwritten Drawing Attached
                  </span>
                  <a
                    href={form.content}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "#818cf8", textDecoration: "none", fontWeight: "600" }}
                  >
                    🔍 Open Fullscreen
                  </a>
                </div>
                <img
                  src={form.content}
                  alt="Handwritten note"
                  style={{
                    width: "100%",
                    maxHeight: "340px",
                    objectFit: "contain",
                    borderRadius: "12px",
                    background: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(form.content, "_blank")}
                  title="Click to view full size"
                />
              </div>
            );
          }

          return (
            <>
              <textarea
                placeholder="Content (Markdown or text)..."
                className={isFullscreen ? "fullscreen-textarea" : ""}
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
              />

              {/* AI BUTTON */}
              <button
                onClick={summarizeNote}
                disabled={!form.content}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "10px",
                  fontWeight: "600",
                }}
              >
                {loadingAI ? "Summarizing..." : "✨ Summarize with AI"}
              </button>

              {/* AI OUTPUT */}
              {summary && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    borderRadius: "12px",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    border: "1px solid #334155",
                  }}
                >
                  <h4 style={{ color: "#c7d2fe", marginBottom: "8px" }}>🧠 AI Summary</h4>
                  <FormattedAIResponse content={summary} />
                </div>
              )}
            </>
          );
        })()}

        {/* ACTIONS */}
        <div className="modal-actions">
          <button className="btn-primary" onClick={saveNote} disabled={isSaving}>
            {isSaving ? "💾 Saving Note..." : "Save Note"}
          </button>

          <button className="btn-secondary" onClick={close} disabled={isSaving}>
            Cancel
          </button>

          {!form.content && (
            <button
              className="handwrite-btn"
              onClick={() => setHandwritingMode(true)}
            >
              ✍️ Handwrite Canvas
            </button>
          )}

          {form.content &&
            (form.content.startsWith("data:image") ||
              form.content.startsWith("http://") ||
              form.content.startsWith("https://") ||
              form.content.includes("cloudinary.com") ||
              form.content.includes("/uploads/") ||
              /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(form.content.trim())) && (
              <>
                <button
                  className="handwrite-btn"
                  onClick={() => setHandwritingMode(true)}
                >
                  ✏️ Edit Drawing
                </button>

                <button
                  className="handwrite-btn danger"
                  onClick={() => {
                    setForm((p) => ({ ...p, content: "" }));
                    setHandwritingMode(true);
                  }}
                >
                  🧹 New Page
                </button>
              </>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
}