// services/api.js
import axios from "axios";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const defaultBaseURL = isLocal
  ? "http://localhost:4000/api"
  : "https://student-study-vault-backend.onrender.com/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

//https://student-study-vault-backend.onrender.com/api
//http://localhost:4000/api