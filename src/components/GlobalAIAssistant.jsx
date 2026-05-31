import { useState, useRef, useEffect } from "react";
import "./GlobalAIAssistant.css";

const BACKEND = "https://student-study-vault-backend.onrender.com";

export default function GlobalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your StudyVault AI assistant. Ask me anything about studying, your notes, reference books, or how to use the platform! ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPulse(false);
    }
  }, [open]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const contextPrompt = `You are StudyVault AI, an intelligent assistant for a student study platform called StudyVault. 
The platform has: Dashboard (stats overview), My Notes (personal notes), Public Notes (community notes), Premium Notes (paid notes), Reference Books, and Wallet (for purchasing premium content).
Features include: creating/editing notes, AI summarization, AI Q&A on notes, handwriting canvas, rating, likes, comments on public notes.
Help students with study tips, platform navigation, note-taking strategies, and academic questions.
Keep responses concise, helpful, and encouraging. Use emojis sparingly.

User question: ${q}`;

      const res = await fetch(`${BACKEND}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contextPrompt, question: q }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Chat cleared! How can I help you? ✨",
      },
    ]);
  };

  const quickPrompts = [
    "How to take better notes?",
    "Study techniques for exams",
    "How does the wallet work?",
  ];

  return (
    <>
      {/* FAB BUTTON */}
      <button
        className={`ai-fab ${open ? "fab-open" : ""} ${pulse ? "fab-pulse" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Assistant"
        title="Ask AI"
      >
        <span className="fab-ring" />
        <span className="fab-inner">
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" />
              <circle cx="9" cy="14" r="1" fill="currentColor" />
              <circle cx="15" cy="14" r="1" fill="currentColor" />
            </svg>
          )}
        </span>
        {!open && <span className="fab-badge">AI</span>}
      </button>

      {/* CHAT PANEL */}
      <div className={`ai-panel ${open ? "panel-open" : ""}`}>
        {/* HEADER */}
        <div className="ai-panel-header">
          <div className="ai-header-left">
            <div className="ai-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" />
                <circle cx="9" cy="14" r="1" fill="currentColor" />
                <circle cx="15" cy="14" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="ai-header-title">StudyVault AI</div>
              <div className="ai-header-status">
                <span className="status-dot" />
                Always ready
              </div>
            </div>
          </div>
          <div className="ai-header-actions">
            <button className="ai-icon-btn" onClick={clearChat} title="Clear chat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
            <button className="ai-icon-btn" onClick={() => setOpen(false)} title="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="ai-msg-avatar">✦</div>
              )}
              <div className="ai-msg-bubble">{msg.text}</div>
            </div>
          ))}

          {loading && (
            <div className="ai-msg ai-msg-assistant">
              <div className="ai-msg-avatar">✦</div>
              <div className="ai-msg-bubble ai-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Quick prompts after first message only */}
          {messages.length === 1 && !loading && (
            <div className="quick-prompts">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  className="quick-prompt-btn"
                  onClick={() => {
                    setInput(p);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="ai-input-area">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            className={`ai-send-btn ${input.trim() ? "active" : ""}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="ai-panel-footer">Powered by StudyVault AI · Press Enter to send</div>
      </div>
    </>
  );
}
