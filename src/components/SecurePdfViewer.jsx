import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import "./SecurePdfViewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function SecurePdfViewer({ pdfUrl }) {
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);

  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [blurred, setBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* =========================
     LOAD PDF
  ========================= */
  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum(1);
      } catch (err) {
        console.error("PDF load failed:", err);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
    };
  }, [pdfUrl]);

  /* =========================
     RENDER PAGE (RESPONSIVE)
  ========================= */
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfRef.current.getPage(pageNum);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const container = canvas.parentElement;
      const containerWidth = container.clientWidth;

      const unscaled = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaled.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pageNum]);

  /* =========================
     BASIC SECURITY
  ========================= */
  useEffect(() => {
    const disableKeys = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "u", "c"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);

    document.addEventListener("keydown", disableKeys);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("keydown", disableKeys);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
   <div className="secure-pdf-wrapper">
  <div
    className={`pdf-container ${blurred ? "blurred" : ""} ${
      isFullscreen ? "fullscreen" : ""
    }`}
    onClick={() => {
      // ✅ Only mobile → enter fullscreen
      if (window.innerWidth <= 768 && !isFullscreen) {
        setIsFullscreen(true);
      }
    }}
  >
    {/* PDF CANVAS */}
    <canvas ref={canvasRef} />

    {/* WATERMARK */}
    <div className="watermark">© Student Study Vault</div>

    {/* CONTROLS (hide in fullscreen if you want cleaner view) */}
    {!isFullscreen && (
      <div className="pdf-controls">
        <button
          disabled={pageNum <= 1}
          onClick={(e) => {
            e.stopPropagation();
            setPageNum((p) => p - 1);
          }}
        >
          ◀ Prev
        </button>

        <span>
          {pageNum} / {numPages}
        </span>

        <button
          disabled={pageNum >= numPages}
          onClick={(e) => {
            e.stopPropagation();
            setPageNum((p) => p + 1);
          }}
        >
          Next ▶
        </button>
      </div>
    )}
  </div>

  {/* FULLSCREEN CLOSE BUTTON */}
  {isFullscreen && (
    <button
      className="close-fullscreen"
      onClick={() => setIsFullscreen(false)}
    >
      ✕
    </button>
  )}
</div>
  );
}