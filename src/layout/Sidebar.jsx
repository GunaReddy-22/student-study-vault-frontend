import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ setIsAuth, isOpen = true, onClose }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    navigate("/login");
  };

  let isDeveloper = false;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      isDeveloper = payload.isDeveloper === true;
    } catch (_) {}
  }

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* ❌ Close button – ONLY for mobile */}
      {onClose && (
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      )}

      <h2 className="logo">StudyVault</h2>

      <nav className="nav-links">
        <NavLink to="/dashboard" onClick={onClose}>
          Dashboard
        </NavLink>

        <NavLink to="/notes" onClick={onClose}>
          My Notes
        </NavLink>

        <NavLink to="/public-notes" onClick={onClose}>
          Public Notes
        </NavLink>

        <NavLink to="/premium" onClick={onClose}>
          Premium Notes
        </NavLink>

        <NavLink to="/reference-books" onClick={onClose}>
          Reference Books
        </NavLink>

        <NavLink to="/quizzes" onClick={onClose}>
          Practice Quizzes
        </NavLink>

        <NavLink to="/wallet" onClick={onClose}>
          Wallet
        </NavLink>

        {isDeveloper && (
          <NavLink
            to="/cms"
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(6, 182, 212, 0.2))",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#38bdf8",
              fontWeight: "700",
            }}
          >
            ⚙️ CMS Control
          </NavLink>
        )}
      </nav>

      <button className="logout-btn" onClick={logout}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;
