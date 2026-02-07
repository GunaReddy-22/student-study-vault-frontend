import axios from "axios";

const API = axios.create({
  baseURL: "https://student-study-vault-backend.onrender.com/api",
});

/* =========================
   AUTH INTERCEPTOR
========================= */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/* =========================
   📚 GET ALL REFERENCE BOOKS
========================= */
export const fetchReferenceBooks = async () => {
  const res = await API.get("/reference-books");
  return res.data;
};

/* =========================
   📘 GET SINGLE BOOK
========================= */
export const fetchReferenceBookById = async (id) => {
  const res = await API.get(`/reference-books/${id}`);
  return res.data;
};

/* =========================
   💳 BUY REFERENCE BOOK
========================= */
export const buyReferenceBook = async (id) => {
  const res = await API.post(`/reference-books/${id}/buy`);
  return res.data;
};

/* =========================
   🔍 CHECK BOOK ACCESS
========================= */
export const checkReferenceBookAccess = async (id) => {
  const res = await API.get(`/reference-books/${id}/access`);
  return res.data.hasAccess;
};

/* =========================
   🔐 GET SIGNED PDF URL
========================= */
export const fetchReferenceBookPdfUrl = async (id) => {
  const res = await API.get(`/reference-books/${id}/pdf`);
  return res.data.url;
};