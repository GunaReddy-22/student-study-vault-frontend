import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", { email });

      // Move to OTP page
      navigate("/verify-otp", { state: { email } });

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2 className="auth-title">Reset Password 🔐</h2>
        <p className="auth-subtitle">
          Enter your email to receive OTP
        </p>

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <div className="auth-footer">
          Remember password?{" "}
          <Link to="/login">Back to Login</Link>
        </div>

      </div>
    </div>
  );
}