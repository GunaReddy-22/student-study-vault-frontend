import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const submit = async () => {
    if (!password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/reset-password", {
        email,
        password,
      });

      alert("Password reset successful ✅");
      navigate("/login");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Invalid Access</h2>
          <p className="auth-subtitle">
            Please restart password reset process.
          </p>
          <Link to="/forgot-password">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2 className="auth-title">Set New Password 🔑</h2>
        <p className="auth-subtitle">
          Enter your new password
        </p>

        <div className="auth-field">
          <label>New Password</label>

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="toggle-password"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        <div className="auth-field">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />
        </div>

        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>

      </div>
    </div>
  );
}