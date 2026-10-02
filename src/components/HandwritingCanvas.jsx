import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./HandwritingCanvas.css";

/* ============================================================
 * 🎨 FULLSCREEN IPAD HANDWRITING CANVAS (PORTAL TO ROOT)
 * Renders directly at document.body with top z-index (overlaying sidebars)
 * ============================================================ */

export default function HandwritingCanvas({ onSave, onClose, initialImage }) {
  const iframeRef = useRef(null);

  const sendInitialImage = () => {
    if (initialImage && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "STUDY_VAULT_LOAD_IMAGE", image: initialImage },
        "*"
      );
    }
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleMessage = (e) => {
      if (!e.data) return;

      if (e.data.type === "STUDY_VAULT_CANVAS_SAVE" && e.data.dataUrl) {
        onSave(e.data.dataUrl);
      } else if (e.data.type === "STUDY_VAULT_CANVAS_CANCEL") {
        onClose();
      } else if (e.data.type === "STUDY_VAULT_STUDIO_READY") {
        sendInitialImage();
      }
    };

    window.addEventListener("message", handleMessage);

    // Also retry after short delay to ensure iframe receives image
    const timer = setTimeout(() => {
      sendInitialImage();
    }, 200);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
    };
  }, [onSave, onClose, initialImage]);

  const handleIframeLoad = () => {
    sendInitialImage();
  };

  return createPortal(
    <div className="handwriting-iframe-wrapper">
      <iframe
        ref={iframeRef}
        src="/handwriting-studio.html"
        title="Handwriting Studio"
        className="handwriting-iframe"
        onLoad={handleIframeLoad}
      />
    </div>,
    document.body
  );
}