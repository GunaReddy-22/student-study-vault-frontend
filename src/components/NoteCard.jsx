import React from "react";
import "./NoteCard.css";
import {
  FaBookOpen,
  FaPenNib,
  FaFileAlt,
  FaBolt,
  FaEdit,
  FaTrash,
  FaGlobe,
  FaCrown
} from "react-icons/fa";
import { isImageContent } from "../utils/noteUtils";

export default function NoteCard({ note, onRead, onEdit, onDelete, onQuiz }) {
  const isImage = isImageContent(note.content);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="modern-note-card card-animate">
      {/* 🏷️ TOP METADATA ROW */}
      <div className="card-top-bar">
        <span className="card-subject-pill">
          {note.subject || "General"}
        </span>

        <div className="card-badge-group">
          {isImage ? (
            <span className="card-type-badge handwritten" title="Handwritten Canvas Note">
              <FaPenNib /> Handwritten
            </span>
          ) : (
            <span className="card-type-badge document" title="Text Document">
              <FaFileAlt /> Document
            </span>
          )}

          {note.isPublic && (
            <span className="card-status-badge public" title="Public Note">
              <FaGlobe />
            </span>
          )}

          {note.isPremium && (
            <span className="card-status-badge premium" title={`Premium Note (₹${note.price})`}>
              <FaCrown /> ₹{note.price}
            </span>
          )}
        </div>
      </div>

      {/* 📌 TITLE */}
      <h3 className="card-title-text" title={note.title}>
        {note.title || "Untitled Note"}
      </h3>

      {/* 🖼️ UNIFORM PREVIEW FRAME */}
      <div
        className="card-preview-viewport"
        onClick={() => onRead && onRead(note)}
        title="Click to open reader"
      >
        {isImage ? (
          <div className="preview-image-wrapper">
            <img src={note.content} alt={note.title} className="preview-drawn-image" />
            <div className="preview-glass-hover">
              <FaBookOpen /> <span>Read Fullscreen</span>
            </div>
          </div>
        ) : (
          <div className="preview-text-wrapper">
            <div className="text-line-deco"></div>
            <p className="preview-text-snippet">
              {note.content?.slice(0, 160) || "Empty document note content..."}
            </p>
            <div className="preview-text-fade"></div>
            <div className="preview-glass-hover">
              <FaBookOpen /> <span>Read Note</span>
            </div>
          </div>
        )}
      </div>

      {/* ⚡ CARD FOOTER ACTIONS */}
      <div className="card-footer-actions">
        <button
          type="button"
          className="action-btn-primary"
          onClick={() => onRead && onRead(note)}
          title="Open Document Reader"
        >
          <FaBookOpen /> <span>Read</span>
        </button>

        <button
          type="button"
          className="action-btn-secondary"
          onClick={() => onEdit(note)}
          title="Edit Note Details"
        >
          <FaEdit /> <span>Edit</span>
        </button>

        {onQuiz && !isImage && (
          <button
            type="button"
            className="action-btn-quiz"
            onClick={() => onQuiz(note)}
            title="Generate AI Practice Quiz"
          >
            <FaBolt /> <span>Quiz</span>
          </button>
        )}

        <button
          type="button"
          className="action-btn-delete"
          onClick={() => onDelete(note._id)}
          title="Delete Note"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}