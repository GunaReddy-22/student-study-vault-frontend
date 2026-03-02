import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function Login({ setIsAuth }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async () => {
    if (loading) return;

    if (!form.email || !form.password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-line"></div>
          <h2 className="auth-title">Welcome Back 👋</h2>
          <p className="auth-subtitle">
            Login to continue to Student Study Vault
          </p>
        </div>

        {/* EMAIL */}
        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        {/* PASSWORD */}
        <div className="auth-field">
          <label>Password</label>

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
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

          {/* 🔥 FORGOT PASSWORD LINK */}
          <div
            style={{
              textAlign: "right",
              marginTop: "6px",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "13px",
                textDecoration: "none",
                color: "#6f7bff",
              }}
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="auth-footer">
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </div>

      </div>
    </div>
  );
}