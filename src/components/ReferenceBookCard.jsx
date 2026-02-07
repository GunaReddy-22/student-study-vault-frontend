import "./referenceBookCard.css";

export default function ReferenceBookCard({ book, onClick }) {
  const {
    title,
    author,
    subject,
    price,
    coverImage,
    purchaseCount,
  } = book;

  return (
    <div
      className="ref-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
    >
      <div className="ref-image">
        <img
          src={coverImage || "/placeholder-book.png"}
          alt={title}
          loading="lazy"
        />

        <span className="ref-price">₹{price}</span>
      </div>

      <div className="ref-content">
        <h4 title={title}>{title}</h4>
        <p className="author">{author}</p>

        <div className="ref-meta">
          <span className="subject">{subject}</span>
          <span className="purchases">
            {purchaseCount || 0} bought
          </span>
        </div>
      </div>
    </div>
  );
}