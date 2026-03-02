import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Get email passed from ForgotPassword
  const email = location.state?.email;

  const submit = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      // Move to reset page
      navigate("/reset-password", {
        state: { email },
      });

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // If user directly opens this page without email
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

        <h2 className="auth-title">Verify OTP 📩</h2>
        <p className="auth-subtitle">
          Enter the OTP sent to your email
        </p>

        <div className="auth-field">
          <label>OTP</label>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
        </div>

        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="auth-footer">
          <Link to="/forgot-password">Resend OTP</Link>
        </div>

      </div>
    </div>
  );
}