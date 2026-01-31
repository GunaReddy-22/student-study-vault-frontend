import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicNotes from "./pages/PublicNotes";
import PremiumNotes from "./pages/PremiumNotes";
import Wallet from "./pages/Wallet";

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

  return (
    <div className="app">
      {/* ☰ Hamburger — MOBILE ONLY */}
      {isAuth && !hideSidebar && !sidebarOpen && (
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}

      {/* Overlay — ONLY when sidebar open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isAuth && !hideSidebar && (
        <Sidebar
          setIsAuth={setIsAuth}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="content">
        <Routes>
          {/* AUTH ROUTES */}
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

          {/* PROTECTED ROUTES */}
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

          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;