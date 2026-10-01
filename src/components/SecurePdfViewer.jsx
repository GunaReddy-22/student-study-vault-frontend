import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import "./SecurePdfViewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function SecurePdfViewer({ pdfUrl, bookTitle = "Reference Book" }) {
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const readerRef = useRef(null);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const touchMoved = useRef(false);
  const isRenderingRef = useRef(false);

  // Retrieve logged-in user info for forensic watermarking
  const [currentUserInfo, setCurrentUserInfo] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.email || parsed.username || "StudyVault User";
      }
    } catch {}
    return "StudyVault Protected";
  });

  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [blurred, setBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  /* =========================
     FULLSCREEN HANDLER
  ========================= */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (readerRef.current?.requestFullscreen) {
          readerRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  
  // Customization & Controls
  const [zoomScale, setZoomScale] = useState(1.0);
  const [fitMode, setFitMode] = useState("page"); // "page" | "width"
  const [readingTheme, setReadingTheme] = useState("dark"); // "dark" | "sepia" | "oled" | "light"
  const [slideDirection, setSlideDirection] = useState("vertical"); // "vertical" | "horizontal"
  const [slideAnimation, setSlideAnimation] = useState(""); // "slide-up" | "slide-down" | "slide-left" | "slide-right"
  const [controlsVisible, setControlsVisible] = useState(true);
  const [jumpInput, setJumpInput] = useState("1");
  const [isJumping, setIsJumping] = useState(false);
  const [windowSize, setWindowSize] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  /* =========================
     LISTEN TO RESIZE
  ========================= */
  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================
     LOAD PDF DOCUMENT
  ========================= */
  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setIsPageLoading(true);
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum(1);
        setJumpInput("1");
      } catch (err) {
        console.error("PDF load failed:", err);
      } finally {
        setIsPageLoading(false);
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
     PAGE NAVIGATION HANDLER
  ========================= */
  const changePage = useCallback(
    (targetPage, forcedDirection = null) => {
      if (!pdfRef.current || isRenderingRef.current) return;
      const target = Math.max(1, Math.min(numPages, targetPage));
      if (target === pageNum) return;

      const isNext = target > pageNum;
      let anim = "";
      if (forcedDirection) {
        anim = forcedDirection;
      } else if (slideDirection === "vertical") {
        anim = isNext ? "slide-up" : "slide-down";
      } else {
        anim = isNext ? "slide-left" : "slide-right";
      }

      setSlideAnimation(anim);
      setPageNum(target);
      setJumpInput(String(target));

      setTimeout(() => {
        setSlideAnimation("");
      }, 350);
    },
    [pageNum, numPages, slideDirection]
  );

  /* =========================
     RENDER PAGE ON CANVAS (SMART SCALING)
  ========================= */
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;

    let activeRenderTask = null;

    const renderPage = async () => {
      try {
        isRenderingRef.current = true;
        setIsPageLoading(true);
        const page = await pdfRef.current.getPage(pageNum);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const viewportEl = readerRef.current?.querySelector(".reader-viewport");
        const isMobile = window.innerWidth <= 768;

        const vpRect = viewportEl ? viewportEl.getBoundingClientRect() : null;
        const availableWidth = vpRect ? Math.max(200, vpRect.width - (isMobile ? 16 : 48)) : (window.innerWidth - 300);
        // Leave clear margin for top header and bottom floating scrubber
        const availableHeight = vpRect ? Math.max(300, vpRect.height - (isMobile ? 75 : 95)) : (window.innerHeight - 180);

        const unscaledViewport = page.getViewport({ scale: 1 });

        let computedScale;
        if (isMobile) {
          // On mobile, fit width edge-to-edge
          computedScale = (availableWidth / unscaledViewport.width) * zoomScale;
        } else if (fitMode === "width") {
          computedScale = (availableWidth / unscaledViewport.width) * zoomScale;
        } else {
          // "page" mode: fit entire page so top and bottom are fully visible without cutoffs
          const scaleHeight = availableHeight / unscaledViewport.height;
          const scaleWidth = availableWidth / unscaledViewport.width;
          computedScale = Math.min(scaleHeight, scaleWidth) * zoomScale;
        }

        const finalScale = Math.max(0.4, computedScale);
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

        const viewport = page.getViewport({
          scale: finalScale * dpr,
        });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        activeRenderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        await activeRenderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      } finally {
        isRenderingRef.current = false;
        setIsPageLoading(false);
      }
    };

    renderPage();

    return () => {
      if (activeRenderTask) {
        activeRenderTask.cancel();
      }
    };
  }, [pageNum, zoomScale, fitMode, isFullscreen, windowSize]);

  /* =========================
     GESTURES / TOUCH SWIPE
  ========================= */
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      touchMoved.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchStartY.current !== null) {
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      if (deltaY > 10 || deltaX > 10) {
        touchMoved.current = true;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - endY;
    const diffX = touchStartX.current - endX;

    const threshold = 40; // minimum swipe distance

    if (slideDirection === "vertical") {
      if (Math.abs(diffY) > threshold && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0) {
          // Swiped UP -> Next Page
          changePage(pageNum + 1, "slide-up");
        } else {
          // Swiped DOWN -> Prev Page
          changePage(pageNum - 1, "slide-down");
        }
      }
    } else {
      if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          // Swiped LEFT -> Next Page
          changePage(pageNum + 1, "slide-left");
        } else {
          // Swiped RIGHT -> Prev Page
          changePage(pageNum - 1, "slide-right");
        }
      }
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  /* =========================
     ANTI-PIRACY & SCREEN PROTECTION
  ========================= */
  const [screenshotWarning, setScreenshotWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : "";
      
      // Prevent PrintScreen key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        setBlurred(true);
        setScreenshotWarning(true);
        try {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText("Content protected by StudyVault DRM. Redistribution strictly prohibited.");
          }
        } catch {}
        setTimeout(() => {
          setBlurred(false);
          setScreenshotWarning(false);
        }, 2000);
        return false;
      }

      // Block DevTools & Saving Shortcuts: F12, Ctrl+S, Ctrl+P, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+C
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && ["s", "p", "u", "c", "a"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ignore navigation arrows if typing in an input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") {
        e.preventDefault();
        changePage(pageNum + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        changePage(pageNum - 1);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };

    // Block right-click globally inside reader
    const onGlobalContextMenu = (e) => {
      if (readerRef.current && readerRef.current.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block beforeprint
    const onBeforePrint = () => {
      setBlurred(true);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setBlurred(true);
      } else {
        setBlurred(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        setBlurred(true);
        setTimeout(() => setBlurred(false), 2000);
      }
    });
    window.addEventListener("contextmenu", onGlobalContextMenu, true);
    window.addEventListener("beforeprint", onBeforePrint);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", onGlobalContextMenu, true);
      window.removeEventListener("beforeprint", onBeforePrint);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [changePage, pageNum, toggleFullscreen]);

  /* =========================
     WHEEL / TRACKPAD SLIDE
  ========================= */
  const lastWheelTime = useRef(0);
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return;

    if (Math.abs(e.deltaY) > 60) {
      lastWheelTime.current = now;
      if (e.deltaY > 0) {
        changePage(pageNum + 1, "slide-up");
      } else {
        changePage(pageNum - 1, "slide-down");
      }
    }
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target)) {
      changePage(target);
      setIsJumping(false);
    }
  };

  return (
    <div
      ref={readerRef}
      className={`secure-pdf-wrapper theme-${readingTheme} ${
        isFullscreen ? "fullscreen-reader" : ""
      } ${blurred ? "window-blurred" : ""}`}
    >
      {/* =========================================
          TOP READER TOOLBAR
      ========================================= */}
      <div className={`reader-header-bar ${controlsVisible ? "visible" : "hidden"}`}>
        <div className="reader-header-top">
          <div className="reader-info">
            <span className="book-reader-title">{bookTitle}</span>
            <span className="reader-page-indicator">
              Page {pageNum} of {numPages || "..."}
            </span>
          </div>

          {/* Fullscreen Toggle (Mobile) */}
          <button
            className="reader-icon-btn fullscreen-btn mobile-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Reader"}
          >
            {isFullscreen ? "🗗 Exit" : "⛶ Fullscreen"}
          </button>
        </div>

        <div className="reader-actions">
          {/* Slide Direction Selector */}
          <div className="mode-toggle-group" title="Page change direction">
            <button
              className={`mode-btn ${slideDirection === "vertical" ? "active" : ""}`}
              onClick={() => setSlideDirection("vertical")}
              title="Slide Up/Down"
            >
              ↕ Slide
            </button>
            <button
              className={`mode-btn ${slideDirection === "horizontal" ? "active" : ""}`}
              onClick={() => setSlideDirection("horizontal")}
              title="Slide Left/Right"
            >
              ↔ Flip
            </button>
          </div>

          {/* Fit Mode Selector */}
          <div className="mode-toggle-group" title="Fit sizing mode">
            <button
              className={`mode-btn ${fitMode === "page" ? "active" : ""}`}
              onClick={() => { setFitMode("page"); setZoomScale(1.0); }}
              title="Fit entire page on screen without cutoffs"
            >
              Page
            </button>
            <button
              className={`mode-btn ${fitMode === "width" ? "active" : ""}`}
              onClick={() => { setFitMode("width"); setZoomScale(1.0); }}
              title="Fit page to width (Large text)"
            >
              Width
            </button>
          </div>

          {/* Theme Selector */}
          <div className="theme-selector-group">
            <button
              className={`theme-dot dark ${readingTheme === "dark" ? "active" : ""}`}
              onClick={() => setReadingTheme("dark")}
              title="Dark Theme"
            />
            <button
              className={`theme-dot sepia ${readingTheme === "sepia" ? "active" : ""}`}
              onClick={() => setReadingTheme("sepia")}
              title="Sepia Eye-Care Theme"
            />
            <button
              className={`theme-dot oled ${readingTheme === "oled" ? "active" : ""}`}
              onClick={() => setReadingTheme("oled")}
              title="OLED Pure Black"
            />
            <button
              className={`theme-dot light ${readingTheme === "light" ? "active" : ""}`}
              onClick={() => setReadingTheme("light")}
              title="Daylight Mode"
            />
          </div>

          {/* Zoom Controls (Desktop only) */}
          <div className="zoom-controls">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
              title="Zoom Out"
            >
              -
            </button>
            <span className="zoom-text">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Fullscreen Toggle (Desktop) */}
          <button
            className="reader-icon-btn fullscreen-btn desktop-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Reader"}
          >
            {isFullscreen ? "🗗 Exit" : "⛶ Fullscreen"}
          </button>
        </div>
      </div>

      {/* =========================================
          MAIN READER VIEWPORT / CANVAS CONTAINER
      ========================================= */}
      <div
        className={`reader-viewport ${slideAnimation}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={() => {
          if (window.innerWidth <= 768 || isFullscreen) {
            setControlsVisible((prev) => !prev);
          }
        }}
      >
        {/* Loading Spinner */}
        {isPageLoading && (
          <div className="reader-loader">
            <div className="spinner-orbit"></div>
            <span>Rendering Page {pageNum}...</span>
          </div>
        )}

        {/* The PDF Canvas */}
        <div
          className="canvas-wrapper"
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
          onDragStart={(e) => { e.preventDefault(); return false; }}
        >
          {/* Anti-Piracy Transparent Shield Layer */}
          <div
            className="piracy-shield"
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
          />

          <canvas ref={canvasRef} />

          {/* Dynamic Forensic Protection Watermark Grid */}
          <div className="watermark">
            <span className="wm-row">LICENSED TO: {currentUserInfo}</span>
            <span className="wm-row main-wm">STUDYVAULT DRM • {new Date().getFullYear()}</span>
            <span className="wm-row">CONFIDENTIAL • {currentUserInfo}</span>
          </div>

          {/* Bottom Security Warning Banner */}
          <div className="canvas-security-footer">
            <span>⚠ Fined up to ₹5 Lakhs on copying or unauthorized sharing</span>
          </div>
        </div>

        {/* Screenshot / Screen Capture Warning Overlay */}
        {screenshotWarning && (
          <div className="drm-alert-toast">
            <span>🔒 Screen Capture Restricted • Protected by StudyVault DRM</span>
          </div>
        )}
      </div>

      {/* =========================================
          FLOATING BOTTOM CONTROLLER & SCRUBBER
      ========================================= */}
      <div className={`reader-floating-footer ${controlsVisible ? "visible" : "hidden"}`}>
        {/* Quick jump -10 */}
        <button
          className="jump-chip"
          disabled={pageNum <= 1}
          onClick={() => changePage(pageNum - 10)}
          title="Jump 10 pages back"
        >
          -10
        </button>

        {/* Previous Page Button */}
        <button
          className="nav-btn prev-btn"
          disabled={pageNum <= 1}
          onClick={() => changePage(pageNum - 1, slideDirection === "vertical" ? "slide-down" : "slide-right")}
        >
          ◀ Prev
        </button>

        {/* Central Page Scrubber / Jump */}
        <div className="scrubber-container">
          <input
            type="range"
            min="1"
            max={numPages || 1}
            value={pageNum}
            onChange={(e) => changePage(Number(e.target.value))}
            className="page-slider"
          />

          <div className="page-badge-action">
            {isJumping ? (
              <form onSubmit={handleJumpSubmit} className="jump-form" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  max={numPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  autoFocus
                  onBlur={() => setIsJumping(false)}
                />
                <button type="submit">Go</button>
              </form>
            ) : (
              <span
                className="page-counter-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsJumping(true);
                }}
                title="Click to jump to specific page"
              >
                <strong>{pageNum}</strong> / {numPages || "..."}
              </span>
            )}
          </div>
        </div>

        {/* Next Page Button */}
        <button
          className="nav-btn next-btn"
          disabled={pageNum >= numPages}
          onClick={() => changePage(pageNum + 1, slideDirection === "vertical" ? "slide-up" : "slide-left")}
        >
          Next ▶
        </button>

        {/* Quick jump +10 */}
        <button
          className="jump-chip"
          disabled={pageNum >= numPages}
          onClick={() => changePage(pageNum + 10)}
          title="Jump 10 pages forward"
        >
          +10
        </button>
      </div>

      {/* Helpful gesture badge for mobile */}
      <div className="gesture-hint-pill">
        <span>👆 Slide up/down or swipe to change page</span>
      </div>
    </div>
  );
}