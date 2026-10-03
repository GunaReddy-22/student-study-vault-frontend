import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import NoteCard from "../components/NoteCard";
import NoteModal from "../components/NoteModal";
import NoteReaderModal from "../components/NoteReaderModal";
import QuizModal from "../components/QuizModal";
import "./Notes.css";
import { isImageContent } from "../utils/noteUtils";
import { FaPlus, FaSearch, FaPenNib, FaFileAlt, FaGlobe, FaCrown, FaBookOpen } from "react-icons/fa";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'handwritten' | 'document' | 'public' | 'premium'
  const [showModal, setShowModal] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [readingNote, setReadingNote] = useState(null);
  const [quizNote, setQuizNote] = useState(null);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  /* ---------------- CREATE ---------------- */
  const openCreate = () => {
    setActiveNote(null);
    setShowModal(true);
  };

  /* ---------------- EDIT ---------------- */
  const openEdit = (note) => {
    setActiveNote(note);
    setShowModal(true);
  };

  /* ---------------- DELETE ---------------- */
  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (readingNote?._id === id) setReadingNote(null);
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  /* ---------------- FILTERING & SEARCH ---------------- */
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const isImg = isImageContent(n.content);
      const matchesSearch =
        (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.subject && n.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (!isImg && n.content?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === "handwritten") return isImg;
      if (activeFilter === "document") return !isImg;
      if (activeFilter === "public") return Boolean(n.isPublic);
      if (activeFilter === "premium") return Boolean(n.isPremium);

      return true;
    });
  }, [notes, searchQuery, activeFilter]);

  return (
    <div className="notes-page-container">
      {/* 🌟 HERO HEADER */}
      <div className="notes-hero-header">
        <div className="notes-hero-left">
          <div className="notes-title-row">
            <h1 className="notes-main-title">Study Vault Notes</h1>
            <span className="notes-count-badge">
              {notes.length} {notes.length === 1 ? "Note" : "Notes"}
            </span>
          </div>
          <p className="notes-hero-subtitle">
            Capture lecture notes, sketch ideas on infinite canvas, and practice with AI
          </p>
        </div>

        <div className="notes-hero-right">
          <button className="btn-create-primary" onClick={openCreate}>
            <FaPlus /> <span>New Note</span>
          </button>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTER CONTROLS BAR */}
      <div className="notes-toolbar">
        <div className="notes-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by topic, subject, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="notes-filter-pills">
          <button
            className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Notes ({notes.length})
          </button>
          <button
            className={`filter-pill ${activeFilter === "handwritten" ? "active" : ""}`}
            onClick={() => setActiveFilter("handwritten")}
          >
            <FaPenNib /> Handwritten
          </button>
          <button
            className={`filter-pill ${activeFilter === "document" ? "active" : ""}`}
            onClick={() => setActiveFilter("document")}
          >
            <FaFileAlt /> Documents
          </button>
          <button
            className={`filter-pill ${activeFilter === "public" ? "active" : ""}`}
            onClick={() => setActiveFilter("public")}
          >
            <FaGlobe /> Public
          </button>
          <button
            className={`filter-pill ${activeFilter === "premium" ? "active" : ""}`}
            onClick={() => setActiveFilter("premium")}
          >
            <FaCrown /> Premium
          </button>
        </div>
      </div>

      {/* 🗂️ NOTES CONTENT GRID */}
      {loading ? (
        <div className="notes-loading-state">
          <div className="notes-spinner"></div>
          <p>Loading your study vault...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="notes-empty-state">
          <div className="empty-state-icon">
            <FaBookOpen />
          </div>
          <h3>No notes found</h3>
          <p>
            {searchQuery || activeFilter !== "all"
              ? "No notes matched your search query or filter. Try clearing filters."
              : "Your vault is empty! Create your first handwritten note or document."}
          </p>
          <button className="btn-create-primary empty-create-btn" onClick={openCreate}>
            <FaPlus /> <span>Create Note Now</span>
          </button>
        </div>
      ) : (
        <div className="notes-grid-layout">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onRead={(n) => setReadingNote(n)}
              onEdit={() => openEdit(note)}
              onDelete={() => deleteNote(note._id)}
              onQuiz={(n) => setQuizNote(n)}
            />
          ))}
        </div>
      )}

      {/* 📖 NOTE READER MODAL */}
      {readingNote && (
        <NoteReaderModal
          note={readingNote}
          onClose={() => setReadingNote(null)}
          onEdit={(n) => openEdit(n)}
          onQuiz={(n) => setQuizNote(n)}
        />
      )}

      {/* ✏️ NOTE CREATE / EDIT MODAL */}
      {showModal && (
        <NoteModal
          note={activeNote}
          close={() => {
            setShowModal(false);
            setActiveNote(null);
          }}
          onCreate={(newNote) => {
            setNotes((prev) => [newNote, ...prev]);
            setShowModal(false);
          }}
          refresh={fetchNotes}
        />
      )}

      {/* 🧠 AI QUIZ MODAL */}
      {quizNote && (
        <QuizModal
          noteId={quizNote._id}
          noteTitle={quizNote.title}
          noteSubject={quizNote.subject}
          onClose={() => setQuizNote(null)}
        />
      )}
    </div>
  );
}






