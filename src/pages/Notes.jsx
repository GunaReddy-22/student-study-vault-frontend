import { useEffect, useState } from "react";
import api from "../services/api";
import NoteCard from "../components/NoteCard";
import NoteModal from "../components/NoteModal";
import QuizModal from "../components/QuizModal";
import "./Notes.css";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [quizNote, setQuizNote] = useState(null);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
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
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="notes-page">
      {/* HEADER */}
      <div className="dashboard-header">
        <h2>📒 My Notes</h2>
      </div>

      {/* NOTES GRID */}
      <div className="notes-grid">
        {/* ADD NEW NOTE CARD (ALWAYS FIRST) */}
        <div className="create-note" onClick={openCreate}>
          <div className="create-plus">+</div>
          <div>Add New Note</div>
        </div>

        {/* EXISTING NOTES */}
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onEdit={() => openEdit(note)}
            onDelete={() => deleteNote(note._id)}
            onQuiz={(n) => setQuizNote(n)}
          />
        ))}
      </div>

      {/* MODAL */}
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

      {/* 🧠 QUIZ MODAL FOR PRIVATE NOTE */}
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






