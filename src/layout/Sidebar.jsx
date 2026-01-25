import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ setIsAuth, isOpen = true, onClose }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    navigate("/login");
  };

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
      </nav>

      <button className="logout-btn" onClick={logout}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;