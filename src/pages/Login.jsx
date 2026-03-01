import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function Login({ setIsAuth }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ NEW

  const navigate = useNavigate();

  const submit = async () => {
    if (loading) return; // prevent double click

    try {
      setLoading(true); // ✅ start loading

      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid username or password");
    } finally {
      setLoading(false); // ✅ stop loading
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

        <div className="auth-field">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
        </div>

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
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        {/* ✅ BUTTON UPDATED */}
        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="auth-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </div>

      </div>
    </div>
  );
} 