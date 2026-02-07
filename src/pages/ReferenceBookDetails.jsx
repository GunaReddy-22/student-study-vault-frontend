import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

import {
  fetchReferenceBookById,
  checkReferenceBookAccess,
  buyReferenceBook,
} from "../services/referenceBookApi";

import "./referenceBookDetails.css";
import SecurePdfViewer from "../components/SecurePdfViewer";

export default function ReferenceBookDetails() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [hasPurchased, setHasPurchased] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);


  /* ===============================
     LOAD BOOK + ACCESS
  =============================== */
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReferenceBookById(id);
        setBook(data);

        const access = await checkReferenceBookAccess(id);
        setHasPurchased(access);
      } catch (err) {
        console.error("Reference book load failed", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);
useEffect(() => {
  if (!hasPurchased) return;

  const loadPdfUrl = async () => {
    try {
      setPdfLoading(true);

      const res = await api.get(`/reference-books/${id}/pdf`);

      setPdfUrl(res.data.url);
    } catch (err) {
      console.error("PDF URL fetch failed", err);
      setPdfUrl(null);
    } finally {
      setPdfLoading(false);
    }
  };

  loadPdfUrl();
}, [hasPurchased, id]);
  /* ===============================
     BUY HANDLER
  =============================== */
  const handleBuy = async () => {
    try {
      setProcessing(true);
      await buyReferenceBook(id);
      setHasPurchased(true);
      alert("✅ Book purchased successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Purchase failed");
    } finally {
      setProcessing(false);
    }
  };

  /* ===============================
     LOADING STATES
  =============================== */
  if (loading) return <p className="loading">Loading book…</p>;
  if (!book) return <p className="loading">Book not found</p>;

  

  return (
  
    <div className="book-details-page">
       <div className="book-glass">
        <div className="book-left">
          <img src={book.coverImage} alt={book.title} />
        </div>

        <div className="book-right">
          <h1>{book.title}</h1>
          <p className="author">by {book.author}</p>

          <div className="badges">
            <span>{book.subject}</span>
            <span>{book.purchases} purchases</span>
          </div>

          <p className="description">{book.description}</p>

          <div className="price-row">
            <div className="price">₹{book.price}</div>

            <button
              className="buy-btn"
              disabled={hasPurchased || processing}
              onClick={handleBuy}
            >
              {hasPurchased
                ? "Purchased"
                : processing
                ? "Processing..."
                : "Buy & Read"}
            </button>
          </div>

          <div className="info-strip">
            <div>
              <strong>Format</strong>
              <span>PDF (View only)</span>
            </div>
            <div>
              <strong>Access</strong>
              <span>Lifetime</span>
            </div>
            <div>
              <strong>Language</strong>
              <span>English</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===============================
          PDF VIEW SECTION (SECURE)
      =============================== */}
     {/* ===============================
    PDF VIEW SECTION (SECURE)
=============================== */}
<div className="reader-section">
  {hasPurchased ? (
    pdfLoading ? (
      <div className="locked-box">📄 Loading book…</div>
    ) : pdfUrl ? (
      <SecurePdfViewer pdfUrl={pdfUrl} />
    ) : (
      <div className="locked-box">❌ Failed to load book</div>
    )
  ) : (
    <div className="locked-box">
      🔒 Purchase this book to read
    </div>
  )}
</div>
      {/* existing content */}
    </div>
  
);
}