import { useRef, useState, useEffect } from "react";
import "./HandwritingCanvas.css";

export default function HandwritingCanvas({ onSave, onClose, initialImage }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [mode, setMode] = useState("pen"); // pen | eraser

  /* INIT CANVAS */
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 700;
    canvas.height = 1200;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalCompositeOperation = "source-over";
    ctxRef.current = ctx;

    if (initialImage) {
      const img = new Image();
      img.src = initialImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [initialImage]);

  /* UPDATE PEN SETTINGS */
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.globalCompositeOperation = "source-over";
  }, [color, lineWidth]);

  /* DRAWING */
  const startDrawing = (e) => {
  setDrawing(true);
  const ctx = ctxRef.current;

  ctx.beginPath();
  ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

  if (mode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = lineWidth * 4; // 🔥 STRONG eraser
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  }
};

const draw = (e) => {
  if (!drawing) return;

  const ctx = ctxRef.current;
  ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  ctx.stroke();
};


  const stopDrawing = () => {
  if (!drawing) return;
  setDrawing(false);

  const ctx = ctxRef.current;
  ctx.closePath();

  // 🔥 RESET MODE AFTER STROKE
  ctx.globalCompositeOperation = "source-over";
};

  const clearCanvas = () => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
  };

  const doneCanvas = () => {
    const image = canvasRef.current.toDataURL("image/png");
    onSave(image); // 👈 return image to NoteModal
  };

  return (
    <div className="handwriting-wrapper">
      {/* TOOLBAR */}
      <div className="handwriting-toolbar">
        <div className="colors">
          {["#ffffff", "#4dabf7", "#51cf66", "#ffd43b", "#ff6b6b"].map((c) => (
            <span
              key={c}
              className="color-dot"
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setMode("pen");
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setMode("pen")}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                mode === "pen"
                  ? "linear-gradient(135deg, #4dabf7, #748ffc)"
                  : "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 600,
            }}
          >
            ✏️ Pen
          </button>

          <button
            onClick={() => setMode("eraser")}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                mode === "eraser"
                  ? "linear-gradient(135deg, #ff6b6b, #fa5252)"
                  : "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 600,
            }}
          >
            🧽 Eraser
          </button>

          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          >
            <option value={2}>Thin</option>
            <option value={4}>Medium</option>
            <option value={6}>Thick</option>
          </select>
        </div>
      </div>

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        className="handwriting-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* ACTIONS */}
      <div className="handwriting-actions">
        <button onClick={clearCanvas}>Clear</button>
        <button onClick={onClose}>Cancel</button>
        <button className="save" onClick={doneCanvas}>
          Done
        </button>
      </div>
    </div>
  );
}






