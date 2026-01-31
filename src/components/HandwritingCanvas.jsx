import { useRef, useState, useEffect } from "react";
import "./HandwritingCanvas.css";

export default function HandwritingCanvas({ onSave, onClose, initialImage }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [mode, setMode] = useState("pen"); // pen | eraser

  /* INIT CANVAS (🔥 MOBILE SAFE) */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalCompositeOperation = "source-over";
    };

    resizeCanvas();
    ctxRef.current = ctx;

    if (initialImage) {
      const img = new Image();
      img.src = initialImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [initialImage]);

  /* UPDATE PEN SETTINGS */
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = lineWidth;
  }, [color, lineWidth]);

  /* 🔥 GET POSITION (MOUSE + TOUCH) */
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  /* DRAWING */
  const startDrawing = (e) => {
    e.preventDefault();
    setDrawing(true);

    const ctx = ctxRef.current;
    const { x, y } = getPos(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (mode === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = lineWidth * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();

    const ctx = ctxRef.current;
    const { x, y } = getPos(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!drawing) return;
    e.preventDefault();

    setDrawing(false);
    const ctx = ctxRef.current;
    ctx.closePath();
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
    onSave(image);
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
          <button onClick={() => setMode("pen")}>✏️ Pen</button>
          <button onClick={() => setMode("eraser")}>🧽 Eraser</button>

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
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
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