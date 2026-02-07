// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://student-study-vault-backend.onrender.com/api",
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