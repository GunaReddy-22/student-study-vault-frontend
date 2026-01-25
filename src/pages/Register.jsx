import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const submit = async () => {
    await api.post("/auth/register", form);
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account ✨</h2>
        <p className="auth-subtitle">Start organizing your study notes</p>

        <div className="auth-field">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        <button className="auth-btn" onClick={submit}>
          Register
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

