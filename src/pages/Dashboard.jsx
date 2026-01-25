import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [publicNotes, setPublicNotes] = useState(0);
  const [privateNotes, setPrivateNotes] = useState(0);

  // ✅ NEW: loading state to prevent jump
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/notes");
        const myNotes = res.data;

        setNotes(myNotes);
        setTotalNotes(myNotes.length);
        setPublicNotes(myNotes.filter((n) => n.isPublic).length);
        setPrivateNotes(myNotes.filter((n) => !n.isPublic).length);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        // ✅ IMPORTANT
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

    const diff = Math.floor(
      (today - d) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString();
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome back to Student Study Vault</p>

      {/* ================= STATS ================= */}
      <div className="stats">
        <div
          className="card clickable tooltip"
          data-tooltip="View all notes"
          onClick={() => navigate("/notes")}
        >
          <div className="card-icon">📘</div>
          <div className="card-title">Total Notes</div>
          <div className="card-count">{totalNotes}</div>
        </div>

        <div
          className="card clickable tooltip"
          data-tooltip="Explore public notes"
          onClick={() => navigate("/public")}
        >
          <div className="card-icon">🌍</div>
          <div className="card-title">Public Notes</div>
          <div className="card-count">{publicNotes}</div>
        </div>

        <div className="card tooltip" data-tooltip="Only visible to you">
          <div className="card-icon">🔒</div>
          <div className="card-title">Private Notes</div>
          <div className="card-count">{privateNotes}</div>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="recent-section">
        <h3>🕒 Recent Activity</h3>

        {/* ✅ FIXED: loading-safe rendering */}
        {loading ? (
          <div className="activity-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ) : recentNotes.length === 0 ? (
          <p className="empty-activity">No recent activity</p>
        ) : (
          <ul className="activity-list fade-in">
            {recentNotes.map((note) => (
              <li
                key={note._id}
                className="activity-item clickable"
                onClick={() => navigate("/notes")}
              >
                <div className="activity-icon">
                  {note.isPublic ? "🌍" : "🔒"}
                </div>

                <div className="activity-text">
                  <strong>{note.title}</strong>

                  <span className="activity-meta">
                    {note.isPublic ? "Public" : "Private"} · {note.subject}
                  </span>

                  <span className="activity-date">
                    {note.updatedAt ? "Updated" : "Created"} ·{" "}
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                </div>

                <div className="activity-action">View →</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}