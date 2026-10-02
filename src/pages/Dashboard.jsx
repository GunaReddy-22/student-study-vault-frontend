import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCreditCard,
  FiFileText,
  FiGlobe,
  FiLock,
  FiClock,
  FiArrowUpRight,
  FiPlusCircle,
  FiCheckSquare,
  FiHeadphones,
  FiStar,
  FiBookOpen,
  FiTrendingUp
} from "react-icons/fi";
import api from "../services/api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [publicNotes, setPublicNotes] = useState(0);
  const [privateNotes, setPrivateNotes] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [username, setUsername] = useState("Scholar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.username) setUsername(payload.username);
      } catch (_) {}
    }

    const fetchDashboardData = async () => {
      try {
        const [notesRes, walletRes] = await Promise.all([
          api.get("/notes"),
          api.get("/wallet"),
        ]);

        const myNotes = notesRes.data || [];
        setNotes(myNotes);
        setTotalNotes(myNotes.length);
        setPublicNotes(myNotes.filter((n) => n.isPublic).length);
        setPrivateNotes(myNotes.filter((n) => !n.isPublic).length);
        setWalletBalance(walletRes.data?.balance || 0);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /* ================= RECENT ACTIVITY ================= */
  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    )
    .slice(0, 5);

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="dashboard-page-container">
      {/* 🌟 HERO BANNER */}
      <div className="dash-hero-banner">
        <div className="dash-hero-content">
          <span className="dash-hero-badge">
            <FiTrendingUp /> Student Knowledge Hub
          </span>
          <h1>Welcome back, <span className="dash-user-name">{username}</span> 👋</h1>
          <p>
            Track your vault notes, manage digital study assets, practice CBT mocks, and stay on top of your learning goals.
          </p>

          {/* Quick Action Pills */}
          <div className="dash-quick-actions">
            <button className="quick-act-btn primary" onClick={() => navigate("/notes")}>
              <FiPlusCircle /> Create Note
            </button>
            <button className="quick-act-btn secondary" onClick={() => navigate("/quizzes")}>
              <FiCheckSquare /> Practice Quizzes
            </button>
            <button className="quick-act-btn secondary" onClick={() => navigate("/premium")}>
              <FiStar /> Premium Notes
            </button>
            <button className="quick-act-btn secondary" onClick={() => navigate("/support")}>
              <FiHeadphones /> Customer Support
            </button>
          </div>
        </div>
      </div>

      {/* ================= STATS GRID ================= */}
      <div className="dash-stats-grid">
        {/* WALLET CARD */}
        <div
          className="dash-stat-card stat-cyan clickable"
          onClick={() => navigate("/wallet")}
        >
          <div className="stat-card-top">
            <div className="stat-icon-wrapper cyan">
              <FiCreditCard />
            </div>
            <span className="stat-pill-tag cyan">Earnings & Top-up</span>
          </div>
          <div className="stat-card-title">Wallet Balance</div>
          <div className="stat-card-value cyan">
            {loading ? "₹..." : `₹ ${walletBalance}`}
          </div>
          <div className="stat-card-footer">
            <span>Manage funds & payouts</span>
            <FiArrowUpRight className="stat-arrow-icon" />
          </div>
        </div>

        {/* TOTAL NOTES CARD */}
        <div
          className="dash-stat-card stat-indigo clickable"
          onClick={() => navigate("/notes")}
        >
          <div className="stat-card-top">
            <div className="stat-icon-wrapper indigo">
              <FiFileText />
            </div>
            <span className="stat-pill-tag indigo">Personal Vault</span>
          </div>
          <div className="stat-card-title">Total Notes</div>
          <div className="stat-card-value indigo">
            {loading ? "..." : totalNotes}
          </div>
          <div className="stat-card-footer">
            <span>View & edit your vault</span>
            <FiArrowUpRight className="stat-arrow-icon" />
          </div>
        </div>

        {/* PUBLIC NOTES CARD */}
        <div
          className="dash-stat-card stat-blue clickable"
          onClick={() => navigate("/public-notes")}
        >
          <div className="stat-card-top">
            <div className="stat-icon-wrapper blue">
              <FiGlobe />
            </div>
            <span className="stat-pill-tag blue">Community</span>
          </div>
          <div className="stat-card-title">Public Notes</div>
          <div className="stat-card-value blue">
            {loading ? "..." : publicNotes}
          </div>
          <div className="stat-card-footer">
            <span>Explore public knowledge</span>
            <FiArrowUpRight className="stat-arrow-icon" />
          </div>
        </div>

        {/* PRIVATE NOTES CARD */}
        <div
          className="dash-stat-card stat-amber clickable"
          onClick={() => navigate("/notes")}
        >
          <div className="stat-card-top">
            <div className="stat-icon-wrapper amber">
              <FiLock />
            </div>
            <span className="stat-pill-tag amber">Encrypted</span>
          </div>
          <div className="stat-card-title">Private Notes</div>
          <div className="stat-card-value amber">
            {loading ? "..." : privateNotes}
          </div>
          <div className="stat-card-footer">
            <span>Only accessible by you</span>
            <FiArrowUpRight className="stat-arrow-icon" />
          </div>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="dash-recent-section">
        <div className="dash-section-header">
          <div className="dash-section-title-wrap">
            <div className="dash-sec-icon-circle">
              <FiClock />
            </div>
            <div>
              <h3>Recent Vault Activity</h3>
              <p>Your latest note updates and creations</p>
            </div>
          </div>
          <button className="dash-view-all-btn" onClick={() => navigate("/notes")}>
            View All Notes <FiArrowUpRight />
          </button>
        </div>

        {loading ? (
          <div className="dash-activity-skeleton">
            <div className="dash-skel-item" />
            <div className="dash-skel-item" />
            <div className="dash-skel-item" />
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="dash-empty-activity">
            <div className="dash-empty-icon-wrap">
              <FiBookOpen />
            </div>
            <h4>No notes found in your vault</h4>
            <p>Start your journey by creating your first handwritten or digital study note.</p>
            <button className="quick-act-btn primary" onClick={() => navigate("/notes")}>
              <FiPlusCircle /> Create Your First Note
            </button>
          </div>
        ) : (
          <div className="dash-activity-list">
            {recentNotes.map((note) => (
              <div
                key={note._id}
                className="dash-activity-row clickable"
                onClick={() => navigate("/notes")}
              >
                <div className="dash-act-type-icon">
                  {note.isPublic ? (
                    <div className="act-badge-icon public" title="Public Note">
                      <FiGlobe />
                    </div>
                  ) : (
                    <div className="act-badge-icon private" title="Private Note">
                      <FiLock />
                    </div>
                  )}
                </div>

                <div className="dash-act-content">
                  <div className="dash-act-title-row">
                    <strong className="dash-act-title">{note.title}</strong>
                    <span className={`dash-note-tag ${note.isPublic ? "pub" : "priv"}`}>
                      {note.isPublic ? "Public" : "Private"}
                    </span>
                    {note.subject && (
                      <span className="dash-subject-chip">{note.subject}</span>
                    )}
                  </div>

                  <span className="dash-act-timestamp">
                    {note.updatedAt ? "Updated" : "Created"} · {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                </div>

                <div className="dash-act-action">
                  <span>Open</span>
                  <FiArrowUpRight />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}