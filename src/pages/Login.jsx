import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiZap,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../services/api";
import "./Auth.css";

export default function Login({ setIsAuth }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!form.email.trim() || !form.password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Invalid credentials. Please try again."
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
            <FiZap />
          </div>
          <h2 className="auth-card-title">Sign In</h2>
          <p className="auth-card-subtitle">
            Enter your credentials to access your StudyVault
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert-banner">
            <FiAlertCircle style={{ flexShrink: 0, fontSize: "15px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form-body" onSubmit={submit}>
          {/* EMAIL */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="login-email"
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
            <div className="auth-input-label-row">
              <label className="auth-input-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot?
              </Link>
            </div>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="auth-text-input"
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errorMsg) setErrorMsg("");
                }}
                autoComplete="current-password"
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
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer">
          Don’t have an account?
          <Link to="/register" className="auth-switch-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}