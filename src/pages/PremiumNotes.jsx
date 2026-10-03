import { useEffect, useState, useRef } from "react";
import {
  FiStar,
  FiAward,
  FiSearch,
  FiLock,
  FiCheck,
  FiHeart,
  FiMessageSquare,
  FiShare2,
  FiBookOpen,
  FiUser,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";
import { FaHeart, FaCommentDots, FaShare, FaPenNib, FaFileAlt } from "react-icons/fa";
import api from "../services/api";
import "./PremiumNotes.css";
import { getUserIdFromToken } from "../utils/getUserId";
import { isImageContent } from "../utils/noteUtils";
import { summarizeContent, askAI } from "../services/ai";
import FormattedAIResponse from "../components/FormattedAIResponse";
import QuizModal from "../components/QuizModal";


export default function PremiumNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

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
  const [showQuiz, setShowQuiz] = useState(false);
  const chatEndRef = useRef(null);

  /* ===================== FETCH ===================== */
  useEffect(() => {
    fetchPremiumNotes();
  }, []);

  const fetchPremiumNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notes/premium");
      setNotes(res.data || []);
    } catch {
      console.error("Failed to load premium notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== FILTERS ===================== */
  const subjects = ["All", ...new Set(notes.map((n) => n.subject).filter(Boolean))];

  const filteredNotes = notes.filter((note) => {
    const titleMatch = note.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const subjectMatch = subject === "All" || note.subject === subject;
    return titleMatch && subjectMatch;
  });

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
    if (isImageContent(content)) {
      alert("✨ AI Summary is for text notes. This is a visual handwritten canvas note.");
      return;
    }

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
      {/* 🌟 HERO BANNER */}
      <div className="prem-hero-banner">
        <div className="prem-hero-content">
          <span className="prem-hero-badge">
            <FiStar /> Verified Scholar Assets
          </span>
          <h1>Premium Curated Notes</h1>
          <p>
            Unlock comprehensive, high-yield study materials crafted by top rankers and expert student educators.
          </p>
        </div>
      </div>

      {/* 🔍 SEARCH & CONTROLS TOOLBAR */}
      <div className="premium-controls-toolbar">
        <div className="prem-search-wrapper">
          <FiSearch className="prem-search-icon" />
          <input
            type="text"
            className="prem-search-input"
            placeholder="Search premium notes by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="prem-filter-dropdowns">
          <select
            className="prem-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub === "All" ? "⭐ All Subjects" : sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🗂️ GRID */}
      <div className="premium-grid">
        {loading ? (
          <div className="prem-loading-state">
            <div className="prem-spinner" />
            <p>Loading premium vault notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="prem-empty-state">
            <div className="prem-empty-icon">
              <FiAward />
            </div>
            <h3>No premium notes found</h3>
            <p>Check back soon or explore our public notes collection.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isUnlocked = accessMap[note._id];
            const isImage = isImageContent(note.content);
            return (
              <div
                key={note._id}
                className="premium-card"
                onClick={() => openNote(note)}
              >
                <div className="prem-card-top-row">
                  <span className="prem-subject-tag">{note.subject || "Academic"}</span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {isImage ? (
                      <span className="prem-status-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                        <FaPenNib /> Handwritten
                      </span>
                    ) : (
                      <span className="prem-status-pill" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", borderColor: "rgba(99, 102, 241, 0.3)" }}>
                        <FaFileAlt /> Doc
                      </span>
                    )}
                    <span className={`prem-status-pill ${isUnlocked ? "unlocked" : "locked"}`}>
                      {isUnlocked ? (
                        <>
                          <FiCheck /> Unlocked
                        </>
                      ) : (
                        <>
                          <FiLock /> Premium
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="prem-card-body">
                  <h3 className="prem-card-title">{note.title}</h3>
                  {isUnlocked && isImage && (
                    <div style={{ margin: "10px 0", height: "100px", background: "#ffffff", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={note.content} alt={note.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div className="prem-author-row">
                    <div className="prem-author-avatar">
                      {(note.userId?.username || "A").charAt(0).toUpperCase()}
                    </div>
                    <span className="prem-author-name">
                      {note.userId?.username || "Author"}
                    </span>
                  </div>
                </div>

                <div className="prem-card-footer">
                  <div className="prem-price-tag">
                    <span className="prem-currency">₹</span>
                    <span className="prem-amount">{note.price || 0}</span>
                  </div>
                  <span className="prem-action-hint">
                    {isUnlocked ? "Read Note" : "Preview"} <FiArrowRight className="prem-arrow-icon" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL ================= */}
      {activeNote && !showQuiz && (
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
              isImageContent(activeNote.content) ? (
                <div style={{ margin: "16px 0", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#6ee7b7", fontWeight: "600" }}>
                      ✍️ Handwritten Note Drawing
                    </span>
                    <a
                      href={activeNote.content}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "12px", color: "#818cf8", textDecoration: "none", fontWeight: "600" }}
                    >
                      🔍 Open Fullscreen
                    </a>
                  </div>
                  <img
                    src={activeNote.content}
                    alt="Premium Note"
                    className="premium-image"
                    style={{
                      width: "100%",
                      maxHeight: "420px",
                      objectFit: "contain",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(activeNote.content, "_blank")}
                    title="Click to view full size in new tab"
                  />
                </div>
              ) : (
                <>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px", marginBottom: "10px" }}>
                  <button
                    onClick={() =>
                      handleSummarize(activeNote._id, activeNote.content)
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                    }}
                  >
                    {loadingAI === activeNote._id
                      ? "Summarizing..."
                      : "✨ Summarize"}
                  </button>

                  <button
                    onClick={() => {
                      if (isImageContent(activeNote.content)) {
                        alert("⚡ AI Quiz generation is for text notes. This is a visual handwritten canvas note.");
                        return;
                      }
                      setShowQuiz(true);
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ⚡ Take AI Quiz
                  </button>
                </div>
                <div className="premium-content">
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
                <FormattedAIResponse content={summaries[activeNote._id]} />
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
              maxWidth: "85%",
              fontSize: "14px",
              lineHeight: "1.5",
              background:
                msg.type === "q"
                  ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                  : "#1e293b",
              color: "#fff",
            }}
          >
            {msg.type === "q" ? (
              msg.text
            ) : (
              <FormattedAIResponse content={msg.text} />
            )}
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
              <button onClick={() => { setActiveNote(null); setShowQuiz(false); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 AI QUIZ MODAL */}
      {showQuiz && activeNote && (
        <QuizModal
          noteId={activeNote._id}
          noteTitle={activeNote.title}
          noteSubject={activeNote.subject}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
