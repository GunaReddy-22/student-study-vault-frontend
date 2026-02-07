import { useEffect, useState } from "react";
import { fetchReferenceBooks } from "../services/referenceBookApi";
import ReferenceBookCard from "../components/ReferenceBookCard";
import ReferenceBookSkeleton from "../components/ReferenceBookSkeleton";
import "./referenceBooks.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AddReferenceBookModal from "../components/AddReferenceBookModal";

export default function ReferenceBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();

  /* ===============================
     DEV CHECK
  =============================== */
  const token = localStorage.getItem("token");
  let isDeveloper = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      console.log("JWT DECODED:", decoded);
      isDeveloper = decoded?.isDeveloper === true;
    } catch (err) {
      console.error("JWT decode failed", err);
    }
  }

  /* ===============================
     LOAD BOOKS
  =============================== */
  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await fetchReferenceBooks();
        setBooks(data || []);
      } catch (err) {
        console.error("Failed to load reference books", err);
        setError("Failed to load reference books");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  /* ===============================
     ERROR STATE
  =============================== */
  if (error) {
    return <p className="loading">{error}</p>;
  }

  /* ===============================
     UI
  =============================== */
  return (
    <div className="reference-page">
      {/* HEADER */}
      <div className="reference-header">
        <h2>📚 Reference Books</h2>

        {isDeveloper && (
          <button
            className="add-book-btn"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Book
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {!loading && books.length === 0 && (
        <div className="empty-state">
          No reference books available yet.
        </div>
      )}

      {/* GRID */}
      <div className="ref-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ReferenceBookSkeleton key={i} />
            ))
          : books.map((book) => (
              <ReferenceBookCard
                key={book._id}
                book={book}
                onClick={() =>
                  navigate(`/reference-books/${book._id}`)
                }
              />
            ))}
      </div>

      {/* DEV MODAL (TEMP TEST) */}
      {showAddModal && (
  <AddReferenceBookModal
    onClose={() => setShowAddModal(false)}
    onSuccess={() => window.location.reload()}
  />
)}
    </div>
  );
}