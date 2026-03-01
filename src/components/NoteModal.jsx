

import { useState, useRef,useEffect } from "react";
import api from "../services/api";
import "./NoteModal.css";
import HandwritingCanvas from "./HandwritingCanvas";

export default function NoteModal({ note, close, refresh }) {
const [form, setForm] = useState({
subject: note?.subject || "",
title: note?.title || "",
content: note?.content || "",
isPublic: note?.isPublic || false,
isPremium: note?.isPremium || false,
price: note?.price || "",
});

const [handwritingMode, setHandwritingMode] = useState(false);
const [isFullscreen, setIsFullscreen] = useState(false);

const saveNote = async () => {
if (!form.content) {
alert("Please add content or handwriting before saving");
return;
}

if (form.isPremium && (!form.price || form.price < 1)) {  
  alert("Premium notes must have a price greater than 0");  
  return;  
}  

try {  
  if (note) {  
    await api.put(`/notes/${note._id}`, form);  
  } else {  
    await api.post("/notes", form);  
  }  

  refresh();  
  close();  
} catch (err) {  
  alert("Failed to save note");  
}

};
useEffect(() => {
if (isFullscreen) {
document.body.style.overflow = "hidden";
} else {
document.body.style.overflow = "";
}
}, [isFullscreen]);
useEffect(() => {
const handleEsc = (e) => {
if (e.key === "Escape") {
setIsFullscreen(false);
}
};

window.addEventListener("keydown", handleEsc);
return () => window.removeEventListener("keydown", handleEsc);
}, []);

return (
<div className="modal-overlay">
<div className={`modal-card ${isFullscreen ? "fullscreen" : ""}`}>
<h3>{note ? "Edit Note" : "Add New Note"}</h3>
<button
className="expand-btn"
onClick={() => setIsFullscreen(!isFullscreen)}

> 

{isFullscreen ? "✖ Close" : "<> Editor"}
</button>

<input  
      placeholder="Subject"  
      value={form.subject}  
      onChange={(e) => setForm({ ...form, subject: e.target.value })}  
    />  

    <input  
      placeholder="Title"  
      value={form.title}  
      onChange={(e) => setForm({ ...form, title: e.target.value })}  
    />  

    {/* PUBLIC */}  
    <div className="toggle-row">  
      <label className="switch">  
        <input  
          type="checkbox"  
          checked={form.isPublic}  
          onChange={(e) =>  
            setForm({ ...form, isPublic: e.target.checked })  
          }  
        />  
        <span className="slider" />  
      </label>  
      <div>  
        <span>Make this note public 🌍</span>  
        <small>Visible to all logged-in users</small>  
      </div>  
    </div>  

    {/* PREMIUM */}  
    <div className="toggle-row">  
      <label className="switch">  
        <input  
          type="checkbox"  
          checked={form.isPremium}  
          onChange={(e) =>  
            setForm({  
              ...form,  
              isPremium: e.target.checked,  
              price: e.target.checked ? form.price : "",  
            })  
          }  
        />  
        <span className="slider" />  
      </label>  
      <div>  
        <span>Make this note premium 💰</span>  
        <small>Users must pay to unlock</small>  
      </div>  
    </div>  

    {form.isPremium && (  
      <input  
        type="number"  
        min="1"  
        placeholder="Price (₹)"  
        value={form.price}  
        onChange={(e) =>  
          setForm({ ...form, price: e.target.value })  
        }  
      />  
    )}  

    {/* CONTENT */}  
    {handwritingMode ? (  
      <HandwritingCanvas  
        initialImage={  
          form.content?.startsWith("data:image") ? form.content : null  
        }  
        onSave={(img) => {  
          setForm((p) => ({ ...p, content: img }));  
          setHandwritingMode(false);  
        }}  
        onClose={() => setHandwritingMode(false)}  
      />  
    ) : form.content?.startsWith("data:image") ? (  
      <div className="image-preview">  
        <img src={form.content} alt="Handwritten note" />  
      </div>  
    ) : (  
      <textarea  
        placeholder="Content"  
        className={isFullscreen ? "fullscreen-textarea" : ""}  
        value={form.content}  
        onChange={(e) =>  
          setForm({ ...form, content: e.target.value })  
        }  
      />  
    )}  

    {/* ACTIONS */}  
    <div className="modal-actions">  
      <button className="btn-primary" onClick={saveNote}>  
        Save  
      </button>  

      <button className="btn-secondary" onClick={close}>  
        Cancel  
      </button>  

      {!form.content && (  
        <button  
          className="handwrite-btn"  
          onClick={() => setHandwritingMode(true)}  
        >  
          ✍️ Handwrite  
        </button>  
      )}  

      {form.content?.startsWith("data:image") && (  
        <>  
          <button  
            className="handwrite-btn"  
            onClick={() => setHandwritingMode(true)}  
          >  
            ✍️ Continue  
          </button>  

          <button  
            className="handwrite-btn danger"  
            onClick={() => {  
              setForm((p) => ({ ...p, content: "" }));  
              setHandwritingMode(true);  
            }}  
          >  
            🧹 New Page  
          </button>  
        </>  
      )}  
    </div>  
  </div>  
</div>

);
}