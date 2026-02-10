import { useEffect, useState } from "react";
import api from "../services/api";
import "./PremiumNotes.css";
import { FaHeart, FaCommentDots, FaShare } from "react-icons/fa";
import { getUserIdFromToken } from "../utils/getUserId";

export default function PremiumNotes() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Likes
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Share
  const [copied, setCopied] = useState(false);

  /* =====================
     FETCH PREMIUM NOTES
  ====================== */
  useEffect(() => {
    fetchPremiumNotes();
  }, []);

  const fetchPremiumNotes = async () => {
    try {
      const res = await api.get("/notes/premium");
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to load premium notes");
    }
  };

  useEffect(() => {
  const cards = document.querySelectorAll(".premium-card");

  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
  });
}, []);

  /* =====================
     OPEN NOTE
  ====================== */
  const openNote = async (note) => {
    setActiveNote(note);

    // Reset per-note UI
    setShowComments(false);
    setCopied(false);
    setNewComment("");

    const userId = getUserIdFromToken();

    setLikesCount(note.likes?.length || 0);
    setLiked(note.likes?.some(id => id.toString() === userId));

    // Access check
    try {
      const res = await api.get(`/notes/premium/${note._id}/access`);
      setHasAccess(res.data.hasAccess);
    } catch {
      setHasAccess(false);
    }

    // Load comments
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
      setLiked(prev => !prev);

      setActiveNote(prev => ({
        ...prev,
        likes: liked
          ? prev.likes.filter(id => id.toString() !== userId)
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
      window.location.origin + "/notes/" + activeNote._id
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* =====================
     UNLOCK
  ====================== */
  const unlockNote = async () => {
    try {
      await api.post(`/notes/premium/${activeNote._id}/unlock`);
      setHasAccess(true);
    } catch {
      alert("Unlock failed");
    }
  }
  const buyPremiumNote = async () => {
  try {
    await api.post(`/notes/${activeNote._id}/buy`);

    // ✅ success UI update
    setHasAccess(true);

    alert("✅ Note purchased successfully!");

  } catch (err) {
    console.error("Purchase error:", err);

    alert(
      err.response?.data?.message ||
      "❌ Purchase failed"
    );
  }
};;

  return (
    <div className="premium-page">
      <h2>⭐ Premium Notes</h2>
      <p>High-quality notes created by top students</p>

      <div className="premium-grid">
        {notes.map((note) => (
          <div
            key={note._id}
            className="premium-card"
            onClick={() => openNote(note)}
          >
            <h3>{note.title}</h3>
            <p className="subject">{note.subject}</p>

            <div className="author">
              ✍️ {note.userId?.username || "Author"}
            </div>

            <div className="price">₹{note.price}</div>
            <div className="lock">🔒 Premium</div>
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {activeNote && (
        <div className="modal-overlay" onClick={() => setActiveNote(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{activeNote.title}</h3>
            <p className="modal-subject">{activeNote.subject}</p>

            {/* ===== INTERACTIONS ===== */}
            <div className="interaction-bar">
              <button
                className={`icon-btn ${liked ? "liked" : ""}`}
                onClick={toggleLike}
                title="Like"
              >
                <FaHeart />
                <span className="like-count">{likesCount}</span>
              </button>

              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(!showComments);
                }}
                title="Comments"
              >
                <FaCommentDots />
                <span className="like-count">{comments.length}</span>
              </button>

              <button
                className="icon-btn"
                onClick={shareNote}
                title="Share"
              >
                <FaShare />
              </button>
            </div>

            {copied && <div className="share-toast">🔗 Link copied</div>}

            {/* ===== CONTENT ===== */}
            {hasAccess ? (
              activeNote.content?.startsWith("data:image") ? (
                <img
                  src={activeNote.content}
                  alt="Premium Note"
                  className="premium-image"
                />
              ) : (
                <div className="premium-content">
                  {activeNote.content}
                </div>
              )
            ) : (
              <div className="locked-box">
                🔒 This is a premium note
                <br />
                Price: ₹{activeNote.price}
              </div>
            )}

            {/* ===== COMMENTS ===== */}
            {showComments && (
              <div className="comment-box">
                <h4>Comments</h4>

                <div className="comment-list">
                  {comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <b>{c.user?.username || c.user?._id|| "User"}</b>
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

            {/* ===== ACTIONS ===== */}
            <div className="modal-actions">
              {!hasAccess && (
                <button className="unlock-btn" onClick={buyPremiumNote}>
                  Buy for ₹{activeNote.price}
                </button>
              )}
              <button className="cancel" onClick={() => setActiveNote(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
