import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiFileText,
  FiGlobe,
  FiStar,
  FiBookOpen,
  FiCheckSquare,
  FiCreditCard,
  FiHeadphones,
  FiSliders,
  FiLogOut,
  FiX
} from "react-icons/fi";
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
          <FiX />
        </button>
      )}

      <h2 className="logo">StudyVault</h2>

      <nav className="nav-links">
        <NavLink to="/dashboard" onClick={onClose}>
          <FiGrid className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/notes" onClick={onClose}>
          <FiFileText className="nav-icon" />
          <span>My Notes</span>
        </NavLink>

        <NavLink to="/public-notes" onClick={onClose}>
          <FiGlobe className="nav-icon" />
          <span>Public Notes</span>
        </NavLink>

        <NavLink to="/premium" onClick={onClose}>
          <FiStar className="nav-icon" />
          <span>Premium Notes</span>
        </NavLink>

        <NavLink to="/reference-books" onClick={onClose}>
          <FiBookOpen className="nav-icon" />
          <span>Reference Books</span>
        </NavLink>

        <NavLink to="/quizzes" onClick={onClose}>
          <FiCheckSquare className="nav-icon" />
          <span>Practice Quizzes</span>
        </NavLink>

        <NavLink to="/wallet" onClick={onClose}>
          <FiCreditCard className="nav-icon" />
          <span>Wallet</span>
        </NavLink>

        <NavLink to="/support" onClick={onClose}>
          <FiHeadphones className="nav-icon" />
          <span>Customer Support</span>
        </NavLink>

        {isDeveloper && (
          <NavLink
            to="/cms"
            onClick={onClose}
            className="cms-nav-link"
          >
            <FiSliders className="nav-icon" />
            <span>CMS Control</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <FiLogOut className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

