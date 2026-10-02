import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  getUserTickets,
  createSupportTicket,
  replyToTicket,
  closeTicket,
} from "../services/supportApi";
import "./CustomerSupport.css";
import {
  FaHeadset,
  FaPlus,
  FaSearch,
  FaTicketAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPaperPlane,
  FaTimes,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaUserShield,
  FaUserGraduate,
  FaCommentDots,
} from "react-icons/fa";

export default function CustomerSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "faqs"
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // New Ticket Form State
  const [form, setForm] = useState({
    subject: "",
    category: "billing",
    priority: "medium",
    description: "",
    attachmentUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Reply State inside Conversation Modal
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // FAQ Accordion State
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  /* ========================================================
     FETCH TICKETS
     ======================================================== */
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getUserTickets();
      if (data && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("Failed to load user tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* ========================================================
     FILTER TICKETS
     ======================================================== */
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus =
        statusFilter === "ALL" || t.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesSearch =
        t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  /* ========================================================
     CREATE TICKET HANDLER
     ======================================================== */
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      alert("Please fill in both Subject and Detailed Description.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        attachments: form.attachmentUrl.trim() ? [form.attachmentUrl.trim()] : [],
      };

      const res = await createSupportTicket(payload);
      if (res.success && res.ticket) {
        setTickets((prev) => [res.ticket, ...prev]);
        setShowCreateModal(false);
        setForm({
          subject: "",
          category: "billing",
          priority: "medium",
          description: "",
          attachmentUrl: "",
        });
        setActiveTicket(res.ticket);
      }
    } catch (err) {
      console.error("Create ticket error:", err);
      alert("Failed to raise ticket: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================================================
     SEND REPLY HANDLER
     ======================================================== */
  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;

    try {
      setReplyLoading(true);
      const res = await replyToTicket(activeTicket._id, replyText.trim());
      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTickets((prev) =>
          prev.map((t) => (t._id === res.ticket._id ? res.ticket : t))
        );
        setReplyText("");
      }
    } catch (err) {
      console.error("Reply error:", err);
      alert("Failed to send reply: " + (err.response?.data?.message || err.message));
    } finally {
      setReplyLoading(false);
    }
  };

  /* ========================================================
     CLOSE TICKET HANDLER
     ======================================================== */
  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    if (!window.confirm("Are you sure you want to mark this support ticket as closed?")) return;

    try {
      const res = await closeTicket(activeTicket._id);
      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTickets((prev) =>
          prev.map((t) => (t._id === res.ticket._id ? res.ticket : t))
        );
      }
    } catch (err) {
      console.error("Close ticket error:", err);
      alert("Failed to close ticket: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <span className="ticket-status-pill open">🟡 Open</span>;
      case "in_progress":
        return <span className="ticket-status-pill progress">🔵 In Progress</span>;
      case "resolved":
        return <span className="ticket-status-pill resolved">🟢 Resolved</span>;
      case "closed":
        return <span className="ticket-status-pill closed">⚪ Closed</span>;
      default:
        return <span className="ticket-status-pill">{status}</span>;
    }
  };

  const getCategoryBadge = (cat) => {
    const map = {
      billing: { label: "💳 Wallet / Billing", color: "#60a5fa" },
      content: { label: "📝 Notes & Canvas", color: "#a78bfa" },
      quiz: { label: "⚡ Quizzes & CBT", color: "#34d399" },
      technical: { label: "🛠️ Technical Bug", color: "#f87171" },
      other: { label: "❓ General Inquiry", color: "#94a3b8" },
    };
    const c = map[cat] || map.other;
    return <span className="ticket-category-tag" style={{ color: c.color }}>{c.label}</span>;
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "urgent":
        return <span className="ticket-priority-pill urgent">🔴 Urgent</span>;
      case "high":
        return <span className="ticket-priority-pill high">🟠 High</span>;
      case "medium":
        return <span className="ticket-priority-pill medium">🟡 Medium</span>;
      case "low":
        return <span className="ticket-priority-pill low">🟢 Low</span>;
      default:
        return <span className="ticket-priority-pill">{p}</span>;
    }
  };

  // FAQ Items
  const FAQ_ITEMS = [
    {
      q: "How do UPI wallet withdrawals work?",
      a: "When you request a withdrawal from your wallet, our team verifies your UPI ID and credits your bank account within 1-2 business hours. You can track status directly in the Wallet tab.",
    },
    {
      q: "How does the Apple iPad-style continuous canvas save?",
      a: "Our canvas lets you write continuously without page boundaries. It automatically crops and saves in milliseconds while uploading full-resolution vector drawings and RAG indexes in the background.",
    },
    {
      q: "Why are quizzes only available for text documents?",
      a: "Our AI engine analyzes structured markdown and lecture text to generate accurate CBT exam questions. Handwritten notes are saved as high-res graphical documents for studying and revision.",
    },
    {
      q: "Can I earn money from sharing public study notes?",
      a: "Yes! Set your note as Premium with a price (₹). When other students unlock your notes or reference guides, 100% of the funds are credited directly to your StudyVault wallet.",
    },
    {
      q: "How fast will customer support respond to my ticket?",
      a: "Our academic support staff and developer team typically respond within 15-45 minutes. You will see replies in your ticket conversation thread in real-time.",
    },
  ];

  return (
    <div className="support-page-container">
      {/* 🌟 HERO HEADER */}
      <div className="support-hero-header">
        <div className="support-hero-left">
          <div className="support-title-row">
            <h1 className="support-main-title">
              <FaHeadset className="hero-icon" /> Customer Support Help Desk
            </h1>
            <span className="support-active-badge">
              {stats.open + stats.inProgress} Active
            </span>
          </div>
          <p className="support-hero-subtitle">
            Need help with notes, wallet transactions, quizzes, or account issues? Raise a ticket and our team will assist you.
          </p>
        </div>

        <div className="support-hero-right">
          <button className="btn-raise-ticket" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> <span>Raise Support Ticket</span>
          </button>
        </div>
      </div>

      {/* 📊 OVERVIEW METRIC CARDS */}
      <div className="support-metrics-grid">
        <div className="support-metric-card">
          <div className="metric-icon-wrap blue">
            <FaTicketAlt />
          </div>
          <div className="metric-info">
            <span className="metric-val">{stats.total}</span>
            <span className="metric-label">Total Tickets</span>
          </div>
        </div>

        <div className="support-metric-card">
          <div className="metric-icon-wrap amber">
            <FaClock />
          </div>
          <div className="metric-info">
            <span className="metric-val">{stats.open}</span>
            <span className="metric-label">Open Tickets</span>
          </div>
        </div>

        <div className="support-metric-card">
          <div className="metric-icon-wrap indigo">
            <FaExclamationTriangle />
          </div>
          <div className="metric-info">
            <span className="metric-val">{stats.inProgress}</span>
            <span className="metric-label">In Progress</span>
          </div>
        </div>

        <div className="support-metric-card">
          <div className="metric-icon-wrap emerald">
            <FaCheckCircle />
          </div>
          <div className="metric-info">
            <span className="metric-val">{stats.resolved}</span>
            <span className="metric-label">Resolved / Closed</span>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS & TOOLBAR */}
      <div className="support-tabs-bar">
        <div className="support-tabs-left">
          <button
            className={`tab-btn ${activeTab === "tickets" ? "active" : ""}`}
            onClick={() => setActiveTab("tickets")}
          >
            <FaTicketAlt /> My Support Tickets ({tickets.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "faqs" ? "active" : ""}`}
            onClick={() => setActiveTab("faqs")}
          >
            <FaQuestionCircle /> Help Center & FAQs
          </button>
        </div>

        {activeTab === "tickets" && (
          <div className="support-search-wrap">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Ticket ID, subject, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* 📑 TAB 1: MY TICKETS VIEW */}
      {activeTab === "tickets" && (
        <div className="support-tickets-section">
          {/* Status Filters */}
          <div className="status-filter-pills">
            <button
              className={`filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              All ({tickets.length})
            </button>
            <button
              className={`filter-chip ${statusFilter === "open" ? "active" : ""}`}
              onClick={() => setStatusFilter("open")}
            >
              🟡 Open ({stats.open})
            </button>
            <button
              className={`filter-chip ${statusFilter === "in_progress" ? "active" : ""}`}
              onClick={() => setStatusFilter("in_progress")}
            >
              🔵 In Progress ({stats.inProgress})
            </button>
            <button
              className={`filter-chip ${statusFilter === "resolved" ? "active" : ""}`}
              onClick={() => setStatusFilter("resolved")}
            >
              🟢 Resolved
            </button>
            <button
              className={`filter-chip ${statusFilter === "closed" ? "active" : ""}`}
              onClick={() => setStatusFilter("closed")}
            >
              ⚪ Closed
            </button>
          </div>

          {/* Ticket Grid / List */}
          {loading ? (
            <div className="support-loading">
              <div className="support-spinner"></div>
              <p>Loading support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="support-empty-state">
              <div className="empty-icon-wrap">
                <FaHeadset />
              </div>
              <h3>No tickets found</h3>
              <p>
                {searchQuery || statusFilter !== "ALL"
                  ? "No support tickets matched your search query or filter."
                  : "You haven't raised any support tickets yet. If you need any assistance, we're here to help!"}
              </p>
              <button className="btn-raise-ticket" onClick={() => setShowCreateModal(true)}>
                <FaPlus /> <span>Raise a Support Ticket</span>
              </button>
            </div>
          ) : (
            <div className="support-cards-grid">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="support-ticket-card"
                  onClick={() => setActiveTicket(ticket)}
                >
                  <div className="card-header-line">
                    <span className="ticket-id-badge">#{ticket.ticketId}</span>
                    <div className="card-status-cluster">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <h3 className="ticket-card-title">{ticket.subject}</h3>

                  <p className="ticket-card-snippet">
                    {ticket.description.slice(0, 110)}
                    {ticket.description.length > 110 ? "..." : ""}
                  </p>

                  <div className="ticket-card-meta">
                    {getCategoryBadge(ticket.category)}
                    <span className="ticket-date">
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="ticket-card-footer">
                    <span className="ticket-msgs-count">
                      <FaCommentDots /> {ticket.messages?.length || 1} Messages
                    </span>
                    <button className="btn-view-thread" type="button">
                      Open Thread &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📚 TAB 2: KNOWLEDGE BASE & FAQS */}
      {activeTab === "faqs" && (
        <div className="support-faqs-section">
          <div className="faq-hero-box">
            <h2>Frequently Asked Questions</h2>
            <p>Find instant answers to common questions regarding study vault features.</p>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaqIdx === idx ? "open" : ""}`}
                onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  {openFaqIdx === idx ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {openFaqIdx === idx && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-cta-box">
            <div>
              <h3>Still need assistance?</h3>
              <p>Our dedicated support team is available to assist you with any questions.</p>
            </div>
            <button className="btn-raise-ticket" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> <span>Raise a Ticket</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: RAISE NEW TICKET MODAL
          ======================================================== */}
      {showCreateModal &&
        createPortal(
          <div className="support-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div
              className="support-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top-bar">
                <div className="modal-title-wrap">
                  <FaHeadset className="modal-icon" />
                  <div>
                    <h3>Raise Support Ticket</h3>
                    <small>Submit your issue and our team will get back to you shortly</small>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="ticket-form">
                <div className="form-group">
                  <label>Subject / Issue Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Wallet Withdrawal not credited, Canvas touch lag"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="billing">💳 Wallet & Payouts</option>
                      <option value="content">📝 Notes & Canvas</option>
                      <option value="quiz">⚡ Quizzes & CBT Tests</option>
                      <option value="technical">🛠️ Technical Bug / Glitch</option>
                      <option value="other">❓ General Inquiry</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority Level</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="low">🟢 Low (General feedback)</option>
                      <option value="medium">🟡 Medium (Default)</option>
                      <option value="high">🟠 High (Impacting study)</option>
                      <option value="urgent">🔴 Urgent (Payment / Blocked)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Detailed Description *</label>
                  <textarea
                    rows="5"
                    placeholder="Please provide details about what happened, steps to reproduce, or transaction reference..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Attachment URL / Screenshot (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/... or image link"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  />
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          MODAL 2: TICKET CONVERSATION & DETAILS MODAL
          ======================================================== */}
      {activeTicket &&
        createPortal(
          <div className="support-modal-overlay" onClick={() => setActiveTicket(null)}>
            <div
              className="ticket-detail-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="detail-modal-header">
                <div className="detail-header-left">
                  <div className="detail-badge-row">
                    <span className="ticket-id-pill">#{activeTicket.ticketId}</span>
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                    {getCategoryBadge(activeTicket.category)}
                  </div>
                  <h2 className="detail-title">{activeTicket.subject}</h2>
                </div>

                <div className="detail-header-right">
                  {activeTicket.status !== "closed" && (
                    <button
                      className="btn-close-ticket"
                      onClick={handleCloseTicket}
                      title="Mark ticket as resolved and closed"
                    >
                      <FaLock /> Close Ticket
                    </button>
                  )}
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveTicket(null)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Chat & Thread Body */}
              <div className="detail-modal-body">
                {/* Original Issue Card */}
                <div className="original-inquiry-box">
                  <div className="inquiry-header">
                    <div className="user-avatar-tag">
                      <FaUserGraduate />
                      <span>Original Issue Statement</span>
                    </div>
                    <span className="inquiry-time">
                      {new Date(activeTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="inquiry-text">{activeTicket.description}</p>
                  {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                    <div className="inquiry-attachments">
                      {activeTicket.attachments.map((att, i) => (
                        <a key={i} href={att} target="_blank" rel="noreferrer" className="attachment-link">
                          📎 View Attached Image {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resolution Notes if resolved */}
                {activeTicket.resolutionNotes && (
                  <div className="resolution-notes-banner">
                    <FaCheckCircle className="check-icon" />
                    <div>
                      <strong>Resolution Notes:</strong> {activeTicket.resolutionNotes}
                    </div>
                  </div>
                )}

                {/* Conversation Thread */}
                <div className="conversation-thread-wrap">
                  <h4 className="thread-title">Conversation Thread</h4>
                  {activeTicket.messages && activeTicket.messages.length > 1 ? (
                    activeTicket.messages.slice(1).map((msg, idx) => {
                      const isAdmin = msg.role === "admin";
                      return (
                        <div
                          key={idx}
                          className={`chat-bubble-wrap ${isAdmin ? "admin-bubble" : "user-bubble"}`}
                        >
                          <div className="bubble-sender-bar">
                            <span className="sender-name">
                              {isAdmin ? (
                                <>
                                  <FaUserShield className="shield-icon" /> StudyVault Staff
                                </>
                              ) : (
                                <>
                                  <FaUserGraduate /> {msg.senderName || "You"}
                                </>
                              )}
                            </span>
                            <span className="bubble-time">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="bubble-text">{msg.message}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-thread-msg">
                      <span>No staff replies yet. Our support team is reviewing your ticket.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Footer */}
              {activeTicket.status !== "closed" ? (
                <div className="detail-modal-footer">
                  <div className="reply-input-bar">
                    <input
                      type="text"
                      placeholder="Type your response to support staff..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <button
                      className="btn-send-reply"
                      onClick={handleSendReply}
                      disabled={replyLoading || !replyText.trim()}
                    >
                      <FaPaperPlane /> <span>{replyLoading ? "Sending..." : "Send"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ticket-closed-notice">
                  <FaLock /> This ticket is closed. If you have a new issue, please raise a new support ticket.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
