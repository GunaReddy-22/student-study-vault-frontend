import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const submit = async () => {
    if (!form.username || !form.email || !form.password) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      alert(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account ✨</h2>
        <p className="auth-subtitle">
          Your all-in-one study platform
        </p>

        {/* NAME (username internally) */}
        <div className="auth-field">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
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
        </div>

        <button
          className="auth-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}