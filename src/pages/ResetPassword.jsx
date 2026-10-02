import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiKey,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../services/api";
import "./Auth.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!password || !confirmPassword) {
      setErrorMsg("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await api.post("/auth/reset-password", {
        email,
        password,
      });

      setSuccessMsg("Password updated! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card-box" style={{ textAlign: "center" }}>
          <div className="auth-alert-banner">
            <FiAlertCircle />
            <span>Session expired or missing email.</span>
          </div>
          <h2 className="auth-card-title">Session Expired</h2>
          <p className="auth-card-subtitle" style={{ marginBottom: "20px" }}>
            Please restart the password recovery process.
          </p>
          <Link to="/forgot-password" className="auth-submit-btn" style={{ textDecoration: "none" }}>
            Back to Password Recovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-ambient-glow auth-glow-top" />
      <div className="auth-ambient-glow auth-glow-bottom" />

      <div className="auth-card-box">
        <div className="auth-card-header">
          <div className="auth-logo-badge">
            <FiKey />
          </div>
          <h2 className="auth-card-title">Set New Password</h2>
          <p className="auth-card-subtitle">
            Configure your new password for <strong style={{ color: "#38bdf8" }}>{email}</strong>
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
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="new-password">
              New Password
            </label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
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

          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input no-toggle"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer">
          <Link to="/login" className="auth-switch-link">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}