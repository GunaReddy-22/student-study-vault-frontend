import { useEffect, useRef } from "react";
import "./HandwritingCanvas.css";

/* ============================================================
 * 🎨 HANDWRITING CANVAS IFRAME BRIDGE
 * Embeds the proven standalone drawing engine (canvas-test architecture)
 * Completely isolates drawing events from React synthetic event interference
 * ============================================================ */

export default function HandwritingCanvas({ onSave, onClose, initialImage }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.data) return;

      if (e.data.type === "STUDY_VAULT_CANVAS_SAVE" && e.data.dataUrl) {
        onSave(e.data.dataUrl);
      } else if (e.data.type === "STUDY_VAULT_CANVAS_CANCEL") {
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSave, onClose]);

  const handleIframeLoad = () => {
    if (initialImage && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "STUDY_VAULT_LOAD_IMAGE", image: initialImage },
        "*"
      );
    }
  };

  return (
    <div className="handwriting-iframe-wrapper">
      <iframe
        ref={iframeRef}
        src="/handwriting-studio.html"
        title="Handwriting Studio"
        className="handwriting-iframe"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}