import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiBookOpen,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../services/api";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await api.post("/auth/register", form);
      setSuccessMsg("Account created! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-ambient-glow auth-glow-top" />
      <div className="auth-ambient-glow auth-glow-bottom" />

      <div className="auth-card-box">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <FiBookOpen />
          </div>
          <h2 className="auth-card-title">Create Account</h2>
          <p className="auth-card-subtitle">
            Join StudyVault to access notes & quizzes
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert-banner">
            <FiAlertCircle style={{ flexShrink: 0, fontSize: "15px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert-banner" style={{ background: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#6ee7b7" }}>
            <FiCheckCircle style={{ flexShrink: 0, fontSize: "15px" }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form className="auth-form-body" onSubmit={submit}>
          {/* NAME */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="auth-input-wrapper">
              <FiUser className="auth-input-icon" />
              <input
                id="register-name"
                type="text"
                className="auth-text-input no-toggle"
                placeholder="e.g. Alex Sharma"
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="register-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="register-email"
                type="email"
                className="auth-text-input no-toggle"
                placeholder="name@university.edu"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="register-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer">
          Already have an account?
          <Link to="/login" className="auth-switch-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}