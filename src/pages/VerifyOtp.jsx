import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FiMail,
  FiArrowRight,
  FiAlertCircle,
  FiRotateCw,
  FiArrowLeft,
} from "react-icons/fi";
import api from "../services/api";
import "./Auth.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!otp.trim() || otp.length < 4) {
      setErrorMsg("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      navigate("/reset-password", {
        state: { email },
      });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || !email) return;
    try {
      setResending(true);
      setErrorMsg("");
      setInfoMsg("");
      await api.post("/auth/forgot-password", { email });
      setInfoMsg("A new code was sent to your email.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
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
            Please start the password recovery process again.
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
            <FiMail />
          </div>
          <h2 className="auth-card-title">Verify Code</h2>
          <p className="auth-card-subtitle">
            Enter the 6-digit code sent to <strong style={{ color: "#38bdf8" }}>{email}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert-banner">
            <FiAlertCircle style={{ flexShrink: 0, fontSize: "15px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert-banner" style={{ background: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#6ee7b7" }}>
            <span>{infoMsg}</span>
          </div>
        )}

        <form className="auth-form-body" onSubmit={submit}>
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="otp-input">
              6-Digit Code
            </label>
            <div className="auth-input-wrapper">
              <input
                id="otp-input"
                type="text"
                className="auth-text-input no-toggle"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.trim());
                  if (errorMsg) setErrorMsg("");
                }}
                maxLength={6}
                style={{ letterSpacing: "4px", fontSize: "16px", fontWeight: 700, textAlign: "center", padding: "0 14px" }}
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
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Confirm Code</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/forgot-password" className="auth-forgot-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <FiArrowLeft /> Change Email
          </Link>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
          >
            <FiRotateCw className={resending ? "auth-spinner" : ""} />
            <span>{resending ? "Sending..." : "Resend Code"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}