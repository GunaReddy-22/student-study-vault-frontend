import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiArrowRight,
  FiKey,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import api from "../services/api";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await api.post("/auth/forgot-password", { email });

      // Move to OTP page
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to send OTP. Please check your email."
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
            <FiKey />
          </div>
          <h2 className="auth-card-title">Reset Password</h2>
          <p className="auth-card-subtitle">
            Enter your email to receive a 6-digit verification code
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert-banner">
            <FiAlertCircle style={{ flexShrink: 0, fontSize: "15px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form-body" onSubmit={submit}>
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="forgot-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="forgot-email"
                type="email"
                className="auth-text-input no-toggle"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="email"
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
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Code</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <FiArrowLeft style={{ fontSize: "14px" }} />
          <span>Remember password?</span>
          <Link to="/login" className="auth-switch-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}