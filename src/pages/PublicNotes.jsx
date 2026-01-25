import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import "./PublicNotes.css";
import { FaHeart, FaCommentDots, FaShare } from "react-icons/fa";
import { getUserIdFromToken } from "../utils/getUserId";

export default function PublicNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

  const [activeNote, setActiveNote] = useState(null);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Share
  const [copied, setCopied] = useState(false);

  const commentRef = useRef(null);

  /* =====================
     FETCH PUBLIC NOTES
  ====================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchPublicNotes();
  }, []);

  const fetchPublicNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notes/public");
      setNotes(res.data);
    } catch (err) {
      console.error("Public notes fetch failed", err.response?.status);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     FILTERS
  ====================== */
  const subjects = ["All", ...new Set(notes.map((n) => n.subject))];

  const filteredNotes = notes.filter((note) => {
    const titleMatch = note.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const subjectMatch = subject === "All" || note.subject === subject;
    return titleMatch && subjectMatch;
  });

  /* =====================
     OPEN NOTE
  ====================== */
  const openNote = async (note) => {
    setActiveNote(note);
    setShowComments(false);
    setCopied(false);
    setNewComment("");

    const userId = getUserIdFromToken();

    setLikesCount(note.likes?.length || 0);
    setLiked(note.likes?.some((id) => id.toString() === userId));

    try {
      const res = await api.get(`/notes/${note._id}/comments`);
      setComments(res.data);
    } catch {
      setComments([]);
    }
  };

  /* =====================
     LIKE / UNLIKE
  ====================== */
  const toggleLike = async (e) => {
    e.stopPropagation();

    try {
      const res = await api.post(`/notes/${activeNote._id}/like`);
      const userId = getUserIdFromToken();

      setLikesCount(res.data.likesCount);
      setLiked((prev) => !prev);

      setActiveNote((prev) => ({
        ...prev,
        likes: liked
          ? prev.likes.filter((id) => id.toString() !== userId)
          : [...prev.likes, userId],
      }));
    } catch {
      alert("Failed to like note");
    }
  };

  /* =====================
     ADD COMMENT
  ====================== */
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await api.post(
        `/notes/${activeNote._id}/comment`,
        { text: newComment }
      );
      setComments(res.data);
      setNewComment("");
    } catch {
      alert("Failed to add comment");
    }
  };

  /* =====================
     SHARE
  ====================== */
  const shareNote = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      window.location.origin + "/public-notes?id=" + activeNote._id
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="public-notes-page">
      <h2>🌍 Public Notes</h2>
      <p className="subtitle">Explore notes shared by other students</p>

      {/* CONTROLS */}
      <div className="public-controls">
        <input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* GRID */}
      <div className="public-notes-grid">
        {loading ? (
          <div className="no-results">Loading public notes…</div>
        ) : filteredNotes.length === 0 ? (
          <div className="no-results">No public notes found</div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note._id}
              className="public-note-card"
              onClick={() => openNote(note)}
            >
              <div className="card-body">
                <h3>{note.title}</h3>
                <div className="subject">{note.subject}</div>
                <div className="author">
                  ✍️ {note.userId?.username || "Unknown"}
                </div>
              </div>

              <div className="card-footer">
                <span className="public-badge">🌍 Public</span>
                <span className="view-hint">Click to view →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== MODAL ===== */}
      {activeNote && (
        <div className="modal-overlay" onClick={() => setActiveNote(null)}>
          <div
            className="modal read-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{activeNote.title}</h3>
            <p className="modal-subject">{activeNote.subject}</p>

            {/* INTERACTIONS */}
            <div className="interaction-bar">
              <button
                className={`icon-btn ${liked ? "liked" : ""}`}
                onClick={toggleLike}
              >
                <FaHeart />
                <span className="like-count">{likesCount}</span>
              </button>

              <button
                className="icon-btn"
                onClick={() => {
                  setShowComments(true);
                  setTimeout(() => {
                    commentRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }, 100);
                }}
              >
                <FaCommentDots />
                <span className="like-count">{comments.length}</span>
              </button>

              <button className="icon-btn" onClick={shareNote}>
                <FaShare />
              </button>
            </div>

            {copied && <div className="share-toast">🔗 Link copied</div>}

            {/* CONTENT */}
            {activeNote.content?.startsWith("data:image") ? (
              <img
                src={activeNote.content}
                alt="Public Note"
                className="public-note-image"
              />
            ) : (
              <div className="public-note-content">
                {activeNote.content}
              </div>
            )}

            {/* COMMENTS */}
            {showComments && (
              <div className="comment-box" ref={commentRef}>
                <h4>Comments</h4>

                <div className="comment-list">
                  {comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <b>{c.user?.username || "User"}</b>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>

                <div className="comment-input">
                  <input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button onClick={addComment}>➤</button>
                </div>
              </div>
            )}

            <button className="cancel" onClick={() => setActiveNote(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}