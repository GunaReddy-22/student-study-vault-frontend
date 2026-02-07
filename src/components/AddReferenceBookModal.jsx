import { useState } from "react";
import "./AddReferenceBookModal.css";
import api from "../services/api";

export default function AddReferenceBookModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    subject: "",
    description: "",
    price: "",
  });

  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cover || !pdf) {
      alert("Cover image & PDF are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("author", form.author);
      formData.append("subject", form.subject);
      formData.append("description", form.description);
      formData.append("price", Number(form.price));
      formData.append("cover", cover);
      formData.append("pdf", pdf);

      await api.post(
  "/reference-books",
  formData
);

      alert("✅ Book added successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to add book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dev-modal-overlay">
      <div className="dev-modal">
        <h3>Add Reference Book</h3>

        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            name="author"
            placeholder="Author"
            value={form.author}
            onChange={handleChange}
            required
          />

          <input
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            required
          />

          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
          />

          <label>Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files[0])}
            required
          />

          <label>PDF File</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files[0])}
            required
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}