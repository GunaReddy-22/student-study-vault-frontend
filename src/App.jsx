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
import PracticeQuizzes from "./pages/PracticeQuizzes";
import QuizRunner from "./pages/QuizRunner";
import CmsDashboard from "./pages/CmsDashboard";
import CustomerSupport from "./pages/CustomerSupport";
import FreeResourcesHub from "./pages/FreeResourcesHub";
import GlobalAIAssistant from "./components/GlobalAIAssistant";
import GlobalStudyCompanion from "./components/GlobalStudyCompanion";

import "./App.css";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const [isAuth, setIsAuth] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isQuizTestRunner = location.pathname.startsWith("/quizzes/test");
  const isQuizSection = location.pathname.startsWith("/quizzes") || location.pathname.startsWith("/practice-quizzes");

  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/verify-otp" ||
    location.pathname === "/reset-password" ||
    isQuizTestRunner;

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuth(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="app">
      {/* Ambient bg orbs */}
      <div className="app-bg-orb orb-1" />
      <div className="app-bg-orb orb-2" />
      <div className="app-bg-orb orb-3" />

      {isAuth && !hideSidebar && !isQuizTestRunner && (
        <header className="mobile-header-bar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Navigation Menu"
          >
            ☰
          </button>
          <div className="mobile-header-brand">
            <span className="mobile-brand-icon">📚</span>
            <span className="mobile-brand-title">StudyVault</span>
          </div>
        </header>
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

      <main className={`content ${hideSidebar ? "auth-mode-content" : ""}`}>
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
            path="/reference%20books"
            element={isAuth ? <Navigate to="/reference-books" replace /> : <Navigate to="/login" />}
          />
          <Route
            path="/reference books"
            element={isAuth ? <Navigate to="/reference-books" replace /> : <Navigate to="/login" />}
          />
          <Route
            path="/reference-books/:id"
            element={
              isAuth ? <ReferenceBookDetails /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/reference%20books/:id"
            element={
              isAuth ? <ReferenceBookDetails /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/reference books/:id"
            element={
              isAuth ? <ReferenceBookDetails /> : <Navigate to="/login" />
            }
          />

          {/* 🎯 Practice Quizzes & CBT Test Runner */}
          <Route
            path="/quizzes"
            element={isAuth ? <PracticeQuizzes /> : <Navigate to="/login" />}
          />
          <Route
            path="/practice-quizzes"
            element={isAuth ? <Navigate to="/quizzes" replace /> : <Navigate to="/login" />}
          />
          <Route
            path="/quizzes/test"
            element={isAuth ? <QuizRunner /> : <Navigate to="/login" />}
          />
          <Route
            path="/quizzes/test/:quizId"
            element={isAuth ? <QuizRunner /> : <Navigate to="/login" />}
          />

          {/* 🌐 Academic Discovery & Free Resources Hub */}
          <Route
            path="/resources"
            element={isAuth ? <FreeResourcesHub /> : <Navigate to="/login" />}
          />
          <Route
            path="/free-resources"
            element={isAuth ? <Navigate to="/resources" replace /> : <Navigate to="/login" />}
          />

          {/* 🎧 Customer Support */}
          <Route
            path="/support"
            element={isAuth ? <CustomerSupport /> : <Navigate to="/login" />}
          />

          {/* ⚙️ Master Developer CMS Control */}
          <Route
            path="/cms"
            element={isAuth ? <CmsDashboard /> : <Navigate to="/login" />}
          />

          <Route path="/" element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>

      {/* Global AI Assistant – visible on authenticated study pages, hidden during Quizzes/Exams */}
      {isAuth && !hideSidebar && !isQuizSection && <GlobalAIAssistant />}

      {/* Global Study Companion (Pomodoro & Ambient Audio Synth & Quick Lexicon) */}
      {isAuth && !hideSidebar && !isQuizTestRunner && <GlobalStudyCompanion />}
    </div>
  );
}

export default App;
