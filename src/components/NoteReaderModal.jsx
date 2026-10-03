import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import "./NoteReaderModal.css";
import FormattedAIResponse from "./FormattedAIResponse";
import {
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaExpand,
  FaCompress,
  FaDownload,
  FaEdit,
  FaBolt,
  FaBrain,
  FaFileAlt,
  FaPenNib,
  FaShareAlt
} from "react-icons/fa";
import { isImageContent } from "../utils/noteUtils";

export default function NoteReaderModal({ note, onClose, onEdit, onQuiz }) {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  const isImage = isImageContent(note.content);

  const handleDownload = () => {
    if (isImage) {
      const link = document.createElement("a");
      link.download = `${note.title || "handwritten-note"}.png`;
      link.href = note.content;
      link.target = "_blank";
      link.click();
    }
  };

  const handleSummarize = async () => {
    if (isImage || !note.content) return;
    try {
      setLoadingAI(true);
      const res = await api.post("/ai/summarize", { content: note.content });
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

  return createPortal(
    <div className="note-reader-overlay">
      <div className={`note-reader-container ${fullscreen ? "fullscreen-reader" : ""}`}>
        {/* 📘 TOP HEADER BAR */}
        <div className="reader-header">
          <div className="reader-meta">
            <div className="reader-badge-row">
              <span className="reader-subject-badge">{note.subject || "General"}</span>
              {isImage ? (
                <span className="reader-type-badge handwritten">
                  <FaPenNib /> Handwritten Note
                </span>
              ) : (
                <span className="reader-type-badge text">
                  <FaFileAlt /> Document Note
                </span>
              )}
              {note.isPublic && <span className="reader-visibility-badge public">🌍 Public</span>}
              {note.isPremium && <span className="reader-visibility-badge premium">💰 ₹{note.price || "0"}</span>}
            </div>
            <h2 className="reader-title">{note.title || "Untitled Note"}</h2>
          </div>

          <div className="reader-actions">
            {isImage && (
              <div className="reader-zoom-controls">
                <button
                  type="button"
                  className="reader-icon-btn"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                  title="Zoom Out"
                >
                  <FaSearchMinus />
                </button>
                <span className="reader-zoom-label">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  className="reader-icon-btn"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  title="Zoom In"
                >
                  <FaSearchPlus />
                </button>
                <button
                  type="button"
                  className="reader-icon-btn"
                  onClick={() => setZoom(1)}
                  title="Reset Zoom"
                >
                  100%
                </button>
              </div>
            )}

            <button
              type="button"
              className="reader-icon-btn"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {fullscreen ? <FaCompress /> : <FaExpand />}
            </button>

            {isImage && (
              <button
                type="button"
                className="reader-icon-btn"
                onClick={handleDownload}
                title="Download Image"
              >
                <FaDownload />
              </button>
            )}

            {onQuiz && !isImage && (
              <button
                type="button"
                className="reader-btn btn-quiz"
                onClick={() => onQuiz(note)}
                title="Generate Practice Quiz"
              >
                <FaBolt /> Quiz
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                className="reader-btn btn-edit"
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
                title="Edit Note"
              >
                <FaEdit /> Edit
              </button>
            )}

            <button
              type="button"
              className="reader-icon-btn btn-close"
              onClick={onClose}
              title="Close (Esc)"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* 📜 DOCUMENT VIEWPORT */}
        <div className="reader-viewport">
          {isImage ? (
            <div className="handwritten-image-wrapper">
              <img
                src={note.content}
                alt={note.title || "Handwritten Note"}
                className="handwritten-document-image"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : (
            <div className="text-document-wrapper">
              <div className="text-document-content">{note.content}</div>

              {/* AI Summarizer */}
              <div className="reader-ai-box">
                <button
                  type="button"
                  className="reader-ai-btn"
                  onClick={handleSummarize}
                  disabled={loadingAI}
                >
                  <FaBrain /> {loadingAI ? "AI is analyzing..." : "✨ Summarize with AI"}
                </button>

                {summary && (
                  <div className="reader-ai-summary">
                    <h4>🧠 Key Takeaways</h4>
                    <FormattedAIResponse content={summary} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
