import "./NoteCard.css";

export default function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="note-card card-animate">
      <h3>{note.subject}</h3>
      <p className="note-title">{note.title}</p>

      <div className="note-actions">
        <button onClick={() => onEdit(note)}>Edit</button>
        <button className="danger" onClick={() => onDelete(note._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}