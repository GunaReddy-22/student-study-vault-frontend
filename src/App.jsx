import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicNotes from "./pages/PublicNotes";
import PremiumNotes from "./pages/PremiumNotes";
import Wallet from "./pages/Wallet";
import ReferenceBooks from "./pages/ReferenceBooks";
import ReferenceBookDetails from "./pages/ReferenceBookDetails";

import "./App.css";

function App() {
  const [isAuth, setIsAuth] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname === "/register";


  useEffect(() => {
  const handleStorageChange = () => {
    setIsAuth(Boolean(localStorage.getItem("token")));
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}, []);

  // 🔐 Disable right click (global)
  /* useEffect(() => {
    const disableRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []); */

  return (
    <div className="app">
      {isAuth && !hideSidebar && !sidebarOpen && (
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      )}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {isAuth && !hideSidebar && (
        <Sidebar
          setIsAuth={setIsAuth}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <main className="content">
        <Routes>
          <Route
            path="/login"
            element={
              isAuth ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login setIsAuth={setIsAuth} />
              )
            }
          />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={isAuth ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/notes"
            element={isAuth ? <Notes /> : <Navigate to="/login" />}
          />
          <Route
            path="/public-notes"
            element={isAuth ? <PublicNotes /> : <Navigate to="/login" />}
          />
          <Route
            path="/premium"
            element={isAuth ? <PremiumNotes /> : <Navigate to="/login" />}
          />
          <Route
            path="/wallet"
            element={isAuth ? <Wallet /> : <Navigate to="/login" />}
          />
          <Route
            path="/reference-books"
            element={isAuth ? <ReferenceBooks /> : <Navigate to="/login" />}
          />
          <Route
            path="/reference-books/:id"
            element={
              isAuth ? <ReferenceBookDetails /> : <Navigate to="/login" />
            }
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;