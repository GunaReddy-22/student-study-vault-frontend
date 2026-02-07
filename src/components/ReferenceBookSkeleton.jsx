import "./ReferenceBookSkeleton.css";

export default function ReferenceBookSkeleton() {
  return (
    <div className="ref-card skeleton">
      <div className="ref-image skeleton-box" />

      <div className="ref-content">
        <div className="skeleton-line title" />
        <div className="skeleton-line author" />

        <div className="ref-meta">
          <div className="skeleton-pill" />
          <div className="skeleton-pill small" />
        </div>
      </div>
    </div>
  );
}
