import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import "./PremiumNotes.css";
import { FaHeart, FaCommentDots, FaShare } from "react-icons/fa";
import { getUserIdFromToken } from "../utils/getUserId";

import { summarizeContent, askAI } from "../services/ai";

export default function PremiumNotes() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMap, setAccessMap] = useState({});

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [copied, setCopied] = useState(false);

  // 🔥 AI STATES
  const [summaries, setSummaries] = useState({});
  const [loadingAI, setLoadingAI] = useState(null);
  const summaryRef = useRef(null);

  const [question, setQuestion] = useState("");
  const [chats, setChats] = useState({});
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);
  /* ===================== FETCH ===================== */
  useEffect(() => {
    fetchPremiumNotes();
  }, []);

  const fetchPremiumNotes = async () => {
    try {
      const res = await api.get("/notes/premium");
      setNotes(res.data);
    } catch {
      console.error("Failed to load premium notes");
    }
  };

  /* ===================== CARD EFFECT ===================== */
  useEffect(() => {
    const cards = document.querySelectorAll(".premium-card");

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--y", `${e.clientY - rect.top}px`);
      });
    });
  }, []);

  /* ===================== OPEN NOTE ===================== */
  const openNote = async (note) => {
    setActiveNote(note);
    setShowComments(false);
    setCopied(false);
    setNewComment("");

    const userId = getUserIdFromToken();

    setLikesCount(note.likes?.length || 0);
    setLiked(note.likes?.some((id) => id.toString() === userId));

    try {
      const res = await api.get(`/notes/premium/${note._id}/access`);
      setHasAccess(res.data.hasAccess);

      setAccessMap((prev) => ({
        ...prev,
        [note._id]: res.data.hasAccess,
      }));
    } catch {
      setHasAccess(false);
    }

    try {
      const res = await api.get(`/notes/${note._id}/comments`);
      setComments(res.data);
    } catch {
      setComments([]);
    }
  };

  /* ===================== LIKE ===================== */
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

  /* ===================== COMMENT ===================== */
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

  /* ===================== SHARE ===================== */
  const shareNote = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      window.location.origin + "/notes/" + activeNote._id
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ===================== BUY ===================== */
  const buyPremiumNote = async () => {
    try {
      await api.post(`/notes/${activeNote._id}/buy`);

      setHasAccess(true);

      setAccessMap((prev) => ({
        ...prev,
        [activeNote._id]: true,
      }));

      alert("✅ Note purchased successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "❌ Purchase failed");
    }
  };

  /* ===================== AI ===================== */
  const handleSummarize = async (noteId, content) => {
    try {
      setLoadingAI(noteId);

      const res = await summarizeContent(content);

      setSummaries((prev) => ({
        ...prev,
        [noteId]: res,
      }));

      setTimeout(() => {
        summaryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    } catch (err) {
      console.error(err);
      alert("AI failed");
    } finally {
      setLoadingAI(null);
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;

    const noteId = activeNote._id;

    try {
      setLoadingChat(true);

      const res = await askAI(
  activeNote._id,
  question,
  chats[noteId] || []
);

      setChats((prev) => ({
  ...prev,
  [noteId]: [
    ...(prev[noteId] || []),
    { type: "q", text: question },
    { type: "a", text: res },
  ],
}));;

      setQuestion("");

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      alert("AI failed");
    } finally {
      setLoadingChat(false);
    }
  };

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
            <div className={`lock ${accessMap[note._id] ? "purchased" : ""}`}>
              {accessMap[note._id] ? "✅ Purchased" : "🔒 Premium"}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {activeNote && (
        <div className="modal-overlay" onClick={() => setActiveNote(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{activeNote.title}</h3>
            <p className="modal-subject">{activeNote.subject}</p>

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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(!showComments);
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
            {hasAccess ? (
              activeNote.content?.startsWith("data:image") ? (
                <img
                  src={activeNote.content}
                  alt="Premium Note"
                  className="premium-image"
                />
              ) : (
                <>
                <div>
                  <button
              onClick={() =>
                handleSummarize(activeNote._id, activeNote.content)
              }
              style={{
                marginTop: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
            >
              {loadingAI === activeNote._id
                ? "Summarizing..."
                : "✨ Summarize"}
            </button>
                </div>
                <div className="premium-content">
                  {/* 🔥 SUMMARIZE BUTTON */}
                  

                  {activeNote.content}
                </div>
                </>
              )
            ) : (
              <div className="locked-box">
                🔒 This is a premium note
                <br />
                Price: ₹{activeNote.price}
              </div>
            )}

            {/* 🔥 SUMMARY OUTPUT */}
            {summaries[activeNote._id] && (
              <div
                ref={summaryRef}
                style={{
                  marginTop: "15px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(15, 23, 42, 0.9)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                  lineHeight: "1.6",
                  fontSize: "14px",
                }}
              >
                <h4 style={{ marginBottom: "10px", color: "#c7d2fe" }}>
                  🧠 AI Summary
                </h4>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {summaries[activeNote._id]}
                </div>
              </div>
            )}
           {hasAccess && (
  <div style={{ marginTop: "20px" }}>
    <h4 style={{ color: "#c7d2fe" }}>💬 Ask AI</h4>

    {/* CHAT */}
    <div
      style={{
        maxHeight: "250px",
        overflowY: "auto",
        padding: "10px",
        background: "#020617",
        borderRadius: "12px",
        border: "1px solid #1e293b",
      }}
    >
      {(chats[activeNote._id] || []).map((msg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.type === "q" ? "flex-end" : "flex-start",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              maxWidth: "75%",
              fontSize: "14px",
              lineHeight: "1.5",
              background:
                msg.type === "q"
                  ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                  : "#1e293b",
              color: "#fff",
            }}
          >
            {msg.text}
          </div>
        </div>
      ))}

      <div ref={chatEndRef} />

      {loadingChat && (
        <div style={{ color: "#94a3b8", fontSize: "13px" }}>
          AI is typing...
        </div>
      )}
    </div>

    {/* INPUT */}
    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something from this note..."
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid #334155",
          background: "#0f172a",
          color: "#fff",
        }}
      />

      <button
        onClick={handleAskAI}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          background: "#22c55e",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Ask
      </button>
    </div>
  </div>
)}

            {/* COMMENTS */}
            {showComments && (
              <div className="comment-box">
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button onClick={addComment}>➤</button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              {!hasAccess && (
                <button onClick={buyPremiumNote}>
                  Buy for ₹{activeNote.price}
                </button>
              )}
              <button onClick={() => setActiveNote(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
