import { useState, useEffect, useCallback } from "react";
import {
  getCmsStats,
  getCmsUsers,
  creditUserWallet,
  debitUserWallet,
  setUserBalance,
  resetUserPassword,
  toggleUserBan,
  deleteUser,
  toggleUserDeveloperRole,
  getCmsQuizzes,
  getQuizById,
  createCmsQuiz,
  updateCmsQuiz,
  cloneQuiz,
  deleteCmsQuiz,
  toggleQuizPublish,
  getCmsNotes,
  deleteCmsNote,
  getCmsTransactions,
  uploadCmsImage,
  getCmsWithdrawals,
  approveCmsWithdrawal,
  rejectCmsWithdrawal,
} from "../services/cmsApi";
import "./CmsDashboard.css";

export default function CmsDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | withdrawals | users | quizzes | cloudinary | notes | ledger
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);

  // Withdrawal Requests State
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState("ALL");
  const [approvingWithdrawal, setApprovingWithdrawal] = useState(null);
  const [payoutRefInput, setPayoutRefInput] = useState("");
  const [payoutNotesInput, setPayoutNotesInput] = useState("");
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  // Wallet Modals (Credit / Debit / Set)
  const [walletModalType, setWalletModalType] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  // Password Reset Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Quizzes State
  const [quizzes, setQuizzes] = useState([]);
  const [quizFilter, setQuizFilter] = useState("ALL");
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [uploadingQuestionIdx, setUploadingQuestionIdx] = useState(null);

  const defaultQuizState = {
    title: "",
    category: "GATE",
    subject: "",
    topic: "",
    difficulty: "Medium",
    timeMinutes: 15,
    isPublished: true,
    questions: [
      {
        question: "",
        type: "mcq",
        imageUrl: "",
        imagePublicId: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        hint: "",
      },
    ],
  };
  const [newQuiz, setNewQuiz] = useState(defaultQuizState);

  // Cloudinary Standalone Tab State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedItems, setUploadedItems] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Notes Moderation State
  const [notes, setNotes] = useState([]);
  const [noteFilter, setNoteFilter] = useState("all");
  const [noteSearch, setNoteSearch] = useState("");

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState("ALL");

  // Image Lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ========================================================
     DATA FETCHERS
     ======================================================== */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCmsStats();
      if (data.success) {
        setStatsData(data);
      }
    } catch (err) {
      console.error("Failed to load CMS stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async (status = "ALL") => {
    try {
      const items = await getCmsWithdrawals(status);
      setWithdrawals(items);
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
    }
  }, []);

  const fetchUsers = useCallback(async (query = "") => {
    try {
      const u = await getCmsUsers(query);
      setUsers(u);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  const fetchQuizzes = useCallback(async () => {
    try {
      const q = await getCmsQuizzes();
      setQuizzes(q);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    }
  }, []);

  const fetchNotes = useCallback(async (type = "all") => {
    try {
      const filter = type !== "all" ? { type } : {};
      const n = await getCmsNotes(filter);
      setNotes(n);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const tx = await getCmsTransactions();
      setTransactions(tx);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWithdrawals();
  }, [fetchStats, fetchWithdrawals]);

  useEffect(() => {
    if (activeTab === "withdrawals") fetchWithdrawals(withdrawalFilter);
    if (activeTab === "users") fetchUsers(searchUser);
    if (activeTab === "quizzes") fetchQuizzes();
    if (activeTab === "notes") fetchNotes(noteFilter);
    if (activeTab === "ledger") fetchTransactions();
  }, [activeTab, fetchWithdrawals, fetchUsers, fetchQuizzes, fetchNotes, fetchTransactions, searchUser, noteFilter, withdrawalFilter]);

  /* ========================================================
     WITHDRAWAL & PAYOUT APPROVAL HANDLERS
     ======================================================== */
  const handleOpenApproveModal = (req) => {
    setApprovingWithdrawal(req);
    // Auto-generate realistic UTR reference
    const autoUtr = `UPI-UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setPayoutRefInput(autoUtr);
    setPayoutNotesInput(`Paid via UPI to ${req.upiId}`);
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approvingWithdrawal) return;

    try {
      setPayoutActionLoading(true);
      const res = await approveCmsWithdrawal(
        approvingWithdrawal._id,
        payoutRefInput,
        payoutNotesInput
      );
      showToast(res.message || "Withdrawal approved and marked as paid!");
      setApprovingWithdrawal(null);
      fetchWithdrawals(withdrawalFilter);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve payout", "error");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleConfirmRejection = async (e) => {
    e.preventDefault();
    if (!rejectingWithdrawal) return;

    try {
      setPayoutActionLoading(true);
      const res = await rejectCmsWithdrawal(
        rejectingWithdrawal._id,
        rejectionReasonInput || "Details could not be verified by developer admin"
      );
      showToast(res.message || "Withdrawal rejected & refunded back to user!");
      setRejectingWithdrawal(null);
      setRejectionReasonInput("");
      fetchWithdrawals(withdrawalFilter);
      fetchUsers(searchUser);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject payout", "error");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  /* ========================================================
     USER & WALLET HANDLERS
     ======================================================== */
  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amt = Number(walletAmount);
    if (isNaN(amt) || amt < 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }

    try {
      setWalletLoading(true);
      if (walletModalType === "credit") {
        await creditUserWallet(selectedUser._id, amt, walletReason);
        showToast(`Successfully credited ₹${amt} to ${selectedUser.username}`);
      } else if (walletModalType === "debit") {
        await debitUserWallet(selectedUser._id, amt, walletReason);
        showToast(`Successfully deducted ₹${amt} from ${selectedUser.username}`);
      } else if (walletModalType === "set") {
        await setUserBalance(selectedUser._id, amt, walletReason);
        showToast(`Balance for ${selectedUser.username} set to ₹${amt}`);
      }

      setWalletModalType(null);
      setSelectedUser(null);
      setWalletAmount("");
      setWalletReason("");
      fetchUsers(searchUser);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Wallet operation failed", "error");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    try {
      setResetLoading(true);
      const res = await resetUserPassword(resetPasswordUser._id, newPasswordInput.trim());
      showToast(res.message || `Password for ${resetPasswordUser.username} updated!`);
      setResetPasswordUser(null);
      setNewPasswordInput("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password", "error");
    } finally {
      setResetLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "Vault";
    for (let i = 0; i < 5; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += "#" + Math.floor(100 + Math.random() * 900);
    setNewPasswordInput(pwd);
  };

  const handleToggleBan = async (user) => {
    const action = user.isBanned ? "reactivate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} account for ${user.username}?`)) return;
    try {
      const res = await toggleUserBan(user._id);
      showToast(res.message);
      fetchUsers(searchUser);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change user status", "error");
    }
  };

  const handleToggleDeveloper = async (userId) => {
    if (!window.confirm("Toggle developer role for this account?")) return;
    try {
      const res = await toggleUserDeveloperRole(userId);
      showToast(res.message || "User role updated successfully");
      fetchUsers(searchUser);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ Permanently delete ${user.username} (${user.email})?`)) return;
    try {
      const res = await deleteUser(user._id);
      showToast(res.message || "User deleted permanently");
      fetchUsers(searchUser);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
    }
  };

  /* ========================================================
     QUIZ CMS BUILDER & QUESTION DIAGRAM UPLOAD
     ======================================================== */
  const addQuestionField = () => {
    setNewQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          type: "mcq",
          imageUrl: "",
          imagePublicId: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          explanation: "",
          hint: "",
        },
      ],
    }));
  };

  const removeQuestionField = (idx) => {
    if (newQuiz.questions.length <= 1) {
      showToast("Quiz requires at least one question.", "error");
      return;
    }
    const updated = newQuiz.questions.filter((_, i) => i !== idx);
    setNewQuiz({ ...newQuiz, questions: updated });
  };

  const handleQuestionImageUpload = async (e, questionIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }

    try {
      setUploadingQuestionIdx(questionIdx);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const uploadRes = await uploadCmsImage(reader.result, "studyvault_quiz_questions");
          if (uploadRes.success && uploadRes.url) {
            const updated = [...newQuiz.questions];
            updated[questionIdx].imageUrl = uploadRes.url;
            updated[questionIdx].imagePublicId = uploadRes.publicId || "";
            setNewQuiz({ ...newQuiz, questions: updated });
            showToast("Question diagram uploaded to Cloudinary CDN!");
          } else {
            showToast(uploadRes.message || "Upload failed", "error");
          }
        } catch (uploadErr) {
          showToast("Upload failed. Verify Cloudinary connection.", "error");
        } finally {
          setUploadingQuestionIdx(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingQuestionIdx(null);
      showToast("Error reading file", "error");
    }
  };

  const handleOpenEditQuiz = async (quiz) => {
    try {
      setEditingQuizId(quiz._id);
      const detailed = await getQuizById(quiz._id);
      setNewQuiz({
        title: detailed.title,
        category: detailed.category || "GATE",
        subject: detailed.subject,
        topic: detailed.topic,
        difficulty: detailed.difficulty || "Medium",
        timeMinutes: detailed.timeMinutes || 15,
        isPublished: detailed.isPublished !== false,
        questions: detailed.questions.map((q) => ({
          question: q.question,
          type: q.type || "mcq",
          imageUrl: q.imageUrl || "",
          imagePublicId: q.imagePublicId || "",
          options: q.options && q.options.length ? q.options : ["", "", "", ""],
          correctAnswer: q.correctAnswer || "",
          explanation: q.explanation || "",
          hint: q.hint || "",
        })),
      });
      setShowQuizModal(true);
    } catch (err) {
      showToast("Failed to load quiz details", "error");
    }
  };

  const handleCloneQuiz = async (quizId) => {
    try {
      const res = await cloneQuiz(quizId);
      showToast(res.message || "Quiz duplicated successfully!");
      fetchQuizzes();
      fetchStats();
    } catch (err) {
      showToast("Failed to clone quiz", "error");
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!newQuiz.title || !newQuiz.subject || !newQuiz.topic) {
      showToast("Title, Subject, and Topic are required.", "error");
      return;
    }

    for (let i = 0; i < newQuiz.questions.length; i++) {
      const q = newQuiz.questions[i];
      if (!q.question.trim() || !q.correctAnswer.trim()) {
        showToast(`Question #${i + 1} is missing question text or correct answer.`, "error");
        return;
      }
    }

    try {
      if (editingQuizId) {
        await updateCmsQuiz(editingQuizId, newQuiz);
        showToast("Quiz updated successfully!");
      } else {
        await createCmsQuiz(newQuiz);
        showToast("Custom quiz created and published successfully!");
      }
      setShowQuizModal(false);
      setEditingQuizId(null);
      setNewQuiz(defaultQuizState);
      fetchQuizzes();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save quiz", "error");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Permanently delete this quiz?")) return;
    try {
      await deleteCmsQuiz(quizId);
      showToast("Quiz deleted successfully");
      fetchQuizzes();
      fetchStats();
    } catch (err) {
      showToast("Failed to delete quiz", "error");
    }
  };

  const handleTogglePublish = async (quizId) => {
    try {
      const res = await toggleQuizPublish(quizId);
      showToast(res.message || "Visibility updated");
      fetchQuizzes();
    } catch (err) {
      showToast("Failed to toggle publish status", "error");
    }
  };

  /* ========================================================
     CLOUDINARY STANDALONE UPLOADER
     ======================================================== */
  const handleStandaloneCloudinaryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await uploadCmsImage(reader.result, "studyvault_assets");
          if (res.success && res.url) {
            setUploadedUrl(res.url);
            setUploadedItems((prev) => [
              { url: res.url, name: file.name, size: (file.size / 1024).toFixed(1) + " KB", date: new Date().toLocaleTimeString() },
              ...prev,
            ]);
            showToast("Asset uploaded to Cloudinary CDN!");
          } else {
            showToast("Upload failed", "error");
          }
        } catch (uErr) {
          showToast("Upload failed. Verify Cloudinary credentials.", "error");
        } finally {
          setUploadLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadLoading(false);
      showToast("Failed to read file", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    showToast("Copied to clipboard!");
  };

  /* ========================================================
     NOTES MODERATION
     ======================================================== */
  const handleDeleteNote = async (noteId, title) => {
    if (!window.confirm(`Delete note "${title}"?`)) return;
    try {
      await deleteCmsNote(noteId);
      showToast("Note deleted by administrator");
      fetchNotes(noteFilter);
      fetchStats();
    } catch (err) {
      showToast("Failed to delete note", "error");
    }
  };

  // Filtered queries
  const pendingWithdrawalsCount = statsData?.stats?.pendingWithdrawals || withdrawals.filter(w => w.status === "PENDING").length;

  const filteredUsers = users.filter((u) => {
    if (userFilter === "students") return !u.isDeveloper && !u.isBanned;
    if (userFilter === "devs") return u.isDeveloper;
    if (userFilter === "suspended") return u.isBanned;
    return true;
  });

  const filteredQuizzes = quizzes.filter((q) => {
    if (quizFilter === "ALL") return true;
    return q.category === quizFilter;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === "ALL") return true;
    return w.status === withdrawalFilter;
  });

  const filteredNotes = notes.filter((n) => {
    if (!noteSearch.trim()) return true;
    const s = noteSearch.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(s)) ||
      (n.subject && n.subject.toLowerCase().includes(s)) ||
      (n.userId?.username && n.userId.username.toLowerCase().includes(s))
    );
  });

  return (
    <div className="cms-wrapper">
      {/* GLOBAL TOAST */}
      {toast && (
        <div className={`cms-floating-toast ${toast.type}`}>
          <span className="toast-dot" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <header className="cms-topbar">
        <div className="cms-brand-unit">
          <div className="cms-brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#brandGrad)" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="brandGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="cms-title-row">
              <h2>StudyVault Master CMS</h2>
              <span className="cms-auth-badge">Developer Admin</span>
            </div>
            <p className="cms-subtitle">
              Platform Authority: Wallets, Live UPI Disbursals, Question Diagrams & Account Management
            </p>
          </div>
        </div>

        <div className="cms-top-meta">
          <div className="cms-metric-pill">
            <span className="metric-dot" />
            <span className="metric-label">Dev Vault:</span>
            <span className="metric-val">₹{statsData?.stats?.developerBalance ?? 5000}</span>
          </div>

          {pendingWithdrawalsCount > 0 && (
            <button
              className="cms-alert-pill"
              onClick={() => {
                setActiveTab("withdrawals");
                setWithdrawalFilter("PENDING");
              }}
            >
              <span className="alert-ping" />
              <span>{pendingWithdrawalsCount} Payout{pendingWithdrawalsCount > 1 ? "s" : ""} Pending</span>
            </button>
          )}

          <button
            className="cms-primary-cta"
            onClick={() => {
              setEditingQuizId(null);
              setNewQuiz(defaultQuizState);
              setShowQuizModal(true);
            }}
          >
            <span>+</span> Create Custom Quiz
          </button>
        </div>
      </header>

      {/* MOBILE QUICK TAB SWITCHER */}
      <div className="cms-mobile-tab-switcher">
        <select
          className="cms-mobile-select-dropdown"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          aria-label="Select CMS Section"
        >
          <option value="overview">📊 Overview & Intelligence</option>
          <option value="withdrawals">
            💸 Withdrawals & Payouts {pendingWithdrawalsCount > 0 ? `(${pendingWithdrawalsCount} Pending!)` : ""}
          </option>
          <option value="users">👥 Users & Wallets ({users.length || statsData?.stats?.totalUsers || 0})</option>
          <option value="quizzes">🎯 Custom Quizzes & Diagrams ({quizzes.length || statsData?.stats?.totalQuizzes || 0})</option>
          <option value="cloudinary">☁️ Cloudinary Media Vault</option>
          <option value="notes">📚 Notes Moderation ({notes.length || statsData?.stats?.totalNotes || 0})</option>
          <option value="ledger">🧾 Audit Ledger ({transactions.length})</option>
        </select>
      </div>

      {/* REFINED NAVIGATION BAR */}
      <nav className="cms-tab-navigation">
        <div className="cms-tabs-track">
          <button
            className={`cms-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === "withdrawals" ? "active" : ""}`}
            onClick={() => setActiveTab("withdrawals")}
          >
            <span className="nav-icon">💸</span>
            <span>Withdrawals & Payouts</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="nav-counter-tag">{pendingWithdrawalsCount}</span>
            )}
          </button>

          <button
            className={`cms-nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span className="nav-icon">👥</span>
            <span>Users & Wallets</span>
            <span className="nav-count-sub">({users.length || statsData?.stats?.totalUsers || 0})</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
          >
            <span className="nav-icon">🎯</span>
            <span>Custom Quizzes</span>
            <span className="nav-count-sub">({quizzes.length || statsData?.stats?.totalQuizzes || 0})</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === "cloudinary" ? "active" : ""}`}
            onClick={() => setActiveTab("cloudinary")}
          >
            <span className="nav-icon">☁️</span>
            <span>Cloudinary Media Vault</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <span className="nav-icon">📚</span>
            <span>Notes Moderation</span>
            <span className="nav-count-sub">({notes.length || statsData?.stats?.totalNotes || 0})</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === "ledger" ? "active" : ""}`}
            onClick={() => setActiveTab("ledger")}
          >
            <span className="nav-icon">🧾</span>
            <span>Transactions Ledger</span>
          </button>
        </div>
      </nav>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="cms-tab-content">
          {loading ? (
            <div className="cms-panel-loader">
              <div className="loader-ring" />
              <p>Fetching platform intelligence & database statistics...</p>
            </div>
          ) : (
            <>
              {/* REFINED MODERN KPI METRIC CARDS */}
              <div className="cms-kpi-grid">
                <div className="cms-kpi-card accent-indigo">
                  <div className="kpi-top">
                    <span className="kpi-tag">Accounts</span>
                    <span className="kpi-icon-pill">👥</span>
                  </div>
                  <div className="kpi-val">{statsData?.stats?.totalUsers ?? 0}</div>
                  <div className="kpi-desc">Registered students & faculty members</div>
                </div>

                <div className="cms-kpi-card accent-cyan">
                  <div className="kpi-top">
                    <span className="kpi-tag">Circulation</span>
                    <span className="kpi-icon-pill">💰</span>
                  </div>
                  <div className="kpi-val">₹{statsData?.stats?.totalCirculationBalance ?? 0}</div>
                  <div className="kpi-desc">Total wallet coins across all accounts</div>
                </div>

                <div className="cms-kpi-card accent-amber">
                  <div className="kpi-top">
                    <span className="kpi-tag">Pending Payouts</span>
                    <span className="kpi-icon-pill">💸</span>
                  </div>
                  <div className="kpi-val" style={{ color: pendingWithdrawalsCount > 0 ? "#fbbf24" : "#f8fafc" }}>
                    {pendingWithdrawalsCount}
                  </div>
                  <div className="kpi-desc">
                    {pendingWithdrawalsCount > 0 ? "Awaiting your UPI transfer approval" : "All payout requests cleared"}
                  </div>
                </div>

                <div className="cms-kpi-card accent-purple">
                  <div className="kpi-top">
                    <span className="kpi-tag">Competitive Mocks</span>
                    <span className="kpi-icon-pill">🎯</span>
                  </div>
                  <div className="kpi-val">{statsData?.stats?.totalQuizzes ?? 0}</div>
                  <div className="kpi-desc">Custom faculty quizzes with diagrams</div>
                </div>

                <div className="cms-kpi-card accent-emerald">
                  <div className="kpi-top">
                    <span className="kpi-tag">Exams Taken</span>
                    <span className="kpi-icon-pill">🏆</span>
                  </div>
                  <div className="kpi-val">{statsData?.stats?.allAttemptsCount ?? 0}</div>
                  <div className="kpi-desc">Graded CBT test submissions</div>
                </div>

                <div className="cms-kpi-card accent-rose">
                  <div className="kpi-top">
                    <span className="kpi-tag">Vault Notes</span>
                    <span className="kpi-icon-pill">📝</span>
                  </div>
                  <div className="kpi-val">{statsData?.stats?.totalNotes ?? 0}</div>
                  <div className="kpi-desc">
                    {statsData?.stats?.publicNotes ?? 0} Public • {statsData?.stats?.premiumNotes ?? 0} Premium
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS BANNER */}
              <div className="cms-action-hero">
                <div className="action-hero-text">
                  <h3>⚡ Quick Administrative Actions</h3>
                  <p>
                    Direct shortcuts to process pending payouts, grant promotional wallet balances, or create interactive competitive exam mocks.
                  </p>
                </div>
                <div className="action-hero-btns">
                  <button className="hero-btn secondary" onClick={() => setActiveTab("withdrawals")}>
                    💸 Review Withdrawals ({pendingWithdrawalsCount})
                  </button>
                  <button className="hero-btn secondary" onClick={() => setActiveTab("users")}>
                    👥 Manage User Balances
                  </button>
                  <button className="hero-btn primary" onClick={() => {
                    setEditingQuizId(null);
                    setNewQuiz(defaultQuizState);
                    setShowQuizModal(true);
                  }}>
                    + New Quiz with Diagrams
                  </button>
                </div>
              </div>

              {/* RECENT USERS SNIPPET */}
              <div className="cms-panel-card">
                <div className="panel-card-header">
                  <div>
                    <h3>🆕 Recently Active Accounts</h3>
                    <p>Latest students registered on the platform</p>
                  </div>
                  <button className="panel-link-btn" onClick={() => setActiveTab("users")}>
                    View All {statsData?.stats?.totalUsers || 0} Accounts →
                  </button>
                </div>

                {/* Desktop Table View */}
                <div className="modern-table-container cms-desktop-table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Wallet Balance</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.recentUsers?.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-avatar-cell">
                              <div className="user-avatar-circle">{u.username.charAt(0).toUpperCase()}</div>
                              <span className="username-text">{u.username}</span>
                            </div>
                          </td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            <span className={`role-pill ${u.isDeveloper ? "dev" : "student"}`}>
                              {u.isDeveloper ? "Developer" : "Student"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${u.isBanned ? "suspended" : "active"}`}>
                              {u.isBanned ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="balance-cell">₹{u.walletBalance || 0}</td>
                          <td className="date-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards Feed */}
                <div className="cms-mobile-cards-container">
                  {statsData?.recentUsers?.map((u) => (
                    <div key={u._id} className="cms-m-card user-m-card">
                      <div className="cms-m-card-header">
                        <div className="user-avatar-cell">
                          <div className="user-avatar-circle">{u.username.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="username-text">{u.username}</div>
                            <span className="email-sub">{u.email}</span>
                          </div>
                        </div>
                        <div className="cms-m-card-badges">
                          <span className={`role-pill ${u.isDeveloper ? "dev" : "student"}`}>
                            {u.isDeveloper ? "Dev" : "Student"}
                          </span>
                          <span className={`status-pill ${u.isBanned ? "suspended" : "active"}`}>
                            {u.isBanned ? "Suspended" : "Active"}
                          </span>
                        </div>
                      </div>
                      <div className="cms-m-card-metrics">
                        <div className="m-metric-item">
                          <span className="m-metric-label">Balance</span>
                          <span className="m-metric-value highlight">₹{u.walletBalance || 0}</span>
                        </div>
                        <div className="m-metric-item">
                          <span className="m-metric-label">Joined</span>
                          <span className="m-metric-value">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: WITHDRAWAL REQUESTS & PAYOUTS ================= */}
      {activeTab === "withdrawals" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>💸 Withdrawal Requests & Payout Settlement</h3>
                <p>
                  Approve payouts and record UTR transaction references, or reject with automatic wallet refund.
                </p>
              </div>

              <div className="cms-controls-row">
                <div className="segmented-filter">
                  <button
                    className={`seg-btn ${withdrawalFilter === "ALL" ? "active" : ""}`}
                    onClick={() => setWithdrawalFilter("ALL")}
                  >
                    All ({withdrawals.length})
                  </button>
                  <button
                    className={`seg-btn ${withdrawalFilter === "PENDING" ? "active" : ""}`}
                    onClick={() => setWithdrawalFilter("PENDING")}
                  >
                    Pending ({withdrawals.filter(w => w.status === "PENDING").length})
                  </button>
                  <button
                    className={`seg-btn ${withdrawalFilter === "APPROVED" ? "active" : ""}`}
                    onClick={() => setWithdrawalFilter("APPROVED")}
                  >
                    Settled
                  </button>
                  <button
                    className={`seg-btn ${withdrawalFilter === "REJECTED" ? "active" : ""}`}
                    onClick={() => setWithdrawalFilter("REJECTED")}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="modern-table-container cms-desktop-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Destination / UPI ID</th>
                    <th>Status</th>
                    <th>Settlement Info</th>
                    <th style={{ textAlign: "right" }}>Developer Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-table-cell">
                        No withdrawal requests found under "{withdrawalFilter}" filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((req) => (
                      <tr key={req._id}>
                        <td className="date-cell">
                          {new Date(req.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <div className="user-avatar-cell">
                            <div className="user-avatar-circle">{req.user?.username?.charAt(0).toUpperCase() || "U"}</div>
                            <div>
                              <div className="username-text">{req.user?.username || "Unknown"}</div>
                              <span className="email-sub">{req.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="payout-amount-cell">
                          ₹{req.amount}
                        </td>
                        <td>
                          {req.method === "UPI" ? (
                            <div className="upi-destination-box">
                              <span className="upi-id-code">{req.upiId}</span>
                              <button
                                className="copy-mini-btn"
                                onClick={() => copyToClipboard(req.upiId)}
                                title="Copy UPI ID"
                              >
                                📋 Copy
                              </button>
                              <a
                                href={`upi://pay?pa=${req.upiId}&pn=${encodeURIComponent(req.user?.username || "Student")}&am=${req.amount}&tn=StudyVaultPayout`}
                                className="upi-app-link"
                                title="Open in UPI App (GPay / PhonePe / Paytm)"
                              >
                                ⚡ Pay
                              </a>
                            </div>
                          ) : (
                            <div className="bank-destination-box">
                              <div>A/C: {req.bankAccountNumber}</div>
                              <div className="ifsc-text">IFSC: {req.ifscCode}</div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`payout-status-badge ${req.status.toLowerCase()}`}>
                            {req.status === "PENDING" && "⏳ Pending Dev Approval"}
                            {req.status === "APPROVED" && "✔ Disbursed"}
                            {req.status === "REJECTED" && "✖ Rejected & Refunded"}
                          </span>
                        </td>
                        <td>
                          {req.status === "APPROVED" && (
                            <div className="settlement-details-box">
                              <span className="utr-ref">Ref: {req.payoutRef}</span>
                              <span className="settled-by">By: @{req.approvedBy?.username || "Dev"}</span>
                            </div>
                          )}
                          {req.status === "REJECTED" && (
                            <div className="rejection-reason-box" title={req.rejectionReason}>
                              {req.rejectionReason}
                            </div>
                          )}
                          {req.status === "PENDING" && (
                            <span className="waiting-text">Awaiting payment verification</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {req.status === "PENDING" ? (
                            <div className="action-buttons-inline" style={{ justifyContent: "flex-end" }}>
                              <button
                                className="table-act-btn success"
                                onClick={() => handleOpenApproveModal(req)}
                                title="Approve and record payment reference"
                              >
                                ✔ Approve & Pay
                              </button>
                              <button
                                className="table-act-btn danger"
                                onClick={() => setRejectingWithdrawal(req)}
                                title="Reject and refund amount back to student"
                              >
                                ✖ Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed View */}
            <div className="cms-mobile-cards-container">
              {filteredWithdrawals.length === 0 ? (
                <div className="empty-table-cell">
                  No withdrawal requests found under "{withdrawalFilter}" filter.
                </div>
              ) : (
                filteredWithdrawals.map((req) => (
                  <div key={req._id} className={`cms-m-card withdrawal-m-card status-${req.status.toLowerCase()}`}>
                    <div className="cms-m-card-header">
                      <div className="m-withdrawal-amt">
                        <span className="m-amt-label">Requested Payout</span>
                        <span className="m-amt-val">₹{req.amount}</span>
                      </div>
                      <span className={`payout-status-badge ${req.status.toLowerCase()}`}>
                        {req.status === "PENDING" && "⏳ Pending"}
                        {req.status === "APPROVED" && "✔ Disbursed"}
                        {req.status === "REJECTED" && "✖ Rejected"}
                      </span>
                    </div>

                    <div className="cms-m-card-body">
                      <div className="user-avatar-cell">
                        <div className="user-avatar-circle">{req.user?.username?.charAt(0).toUpperCase() || "U"}</div>
                        <div>
                          <div className="username-text">{req.user?.username || "Unknown"}</div>
                          <span className="email-sub">{req.user?.email}</span>
                        </div>
                      </div>

                      <div className="m-destination-strip">
                        {req.method === "UPI" ? (
                          <div className="upi-destination-box">
                            <span className="upi-id-code">{req.upiId}</span>
                            <button
                              className="copy-mini-btn"
                              onClick={() => copyToClipboard(req.upiId)}
                            >
                              📋 Copy
                            </button>
                            <a
                              href={`upi://pay?pa=${req.upiId}&pn=${encodeURIComponent(req.user?.username || "Student")}&am=${req.amount}&tn=StudyVaultPayout`}
                              className="upi-app-link"
                            >
                              ⚡ Pay in App
                            </a>
                          </div>
                        ) : (
                          <div className="bank-destination-box">
                            <div>A/C: {req.bankAccountNumber}</div>
                            <div className="ifsc-text">IFSC: {req.ifscCode}</div>
                          </div>
                        )}
                      </div>

                      {req.status === "APPROVED" && (
                        <div className="settlement-details-box" style={{ marginTop: "6px" }}>
                          <span className="utr-ref">Ref: {req.payoutRef}</span>
                          <span className="settled-by">Approved by: @{req.approvedBy?.username || "Dev"}</span>
                        </div>
                      )}

                      {req.status === "REJECTED" && (
                        <div className="rejection-reason-box" style={{ marginTop: "6px" }}>
                          Reason: {req.rejectionReason}
                        </div>
                      )}

                      <div className="date-cell" style={{ marginTop: "6px" }}>
                        Requested: {new Date(req.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {req.status === "PENDING" && (
                      <div className="cms-m-card-actions payout-actions-row">
                        <button
                          className="table-act-btn success full-flex"
                          onClick={() => handleOpenApproveModal(req)}
                        >
                          ✔ Approve & Pay
                        </button>
                        <button
                          className="table-act-btn danger full-flex"
                          onClick={() => setRejectingWithdrawal(req)}
                        >
                          ✖ Reject & Refund
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: USERS & WALLET CONTROL ================= */}
      {activeTab === "users" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>👥 User Directory & Account Authority</h3>
                <p>Modify balances, reset credentials, suspend access, and grant developer privileges.</p>
              </div>

              <div className="cms-controls-row">
                <div className="segmented-filter">
                  <button
                    className={`seg-btn ${userFilter === "all" ? "active" : ""}`}
                    onClick={() => setUserFilter("all")}
                  >
                    All ({users.length})
                  </button>
                  <button
                    className={`seg-btn ${userFilter === "students" ? "active" : ""}`}
                    onClick={() => setUserFilter("students")}
                  >
                    Students
                  </button>
                  <button
                    className={`seg-btn ${userFilter === "devs" ? "active" : ""}`}
                    onClick={() => setUserFilter("devs")}
                  >
                    Devs
                  </button>
                  <button
                    className={`seg-btn ${userFilter === "suspended" ? "active" : ""}`}
                    onClick={() => setUserFilter("suspended")}
                  >
                    Suspended
                  </button>
                </div>

                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="modern-search-input"
                    placeholder="Search username or email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="modern-table-container cms-desktop-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Balance</th>
                    <th style={{ textAlign: "right" }}>Financial & Security Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-table-cell">
                        No accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="user-avatar-cell">
                            <div className="user-avatar-circle">{u.username.charAt(0).toUpperCase()}</div>
                            <span className="username-text">{u.username}</span>
                          </div>
                        </td>
                        <td className="email-cell">{u.email}</td>
                        <td>
                          <span className={`role-pill ${u.isDeveloper ? "dev" : "student"}`}>
                            {u.isDeveloper ? "Developer" : "Student"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${u.isBanned ? "suspended" : "active"}`}>
                            {u.isBanned ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td>{u.notesCount}</td>
                        <td className="balance-cell highlight">₹{u.walletBalance}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons-inline" style={{ justifyContent: "flex-end" }}>
                            {/* Credit */}
                            <button
                              className="table-act-btn success"
                              onClick={() => {
                                setSelectedUser(u);
                                setWalletModalType("credit");
                                setWalletAmount("");
                                setWalletReason("Developer Admin Grant");
                              }}
                              title="Add Balance (+₹)"
                            >
                              + Credit
                            </button>

                            {/* Debit */}
                            <button
                              className="table-act-btn danger"
                              onClick={() => {
                                setSelectedUser(u);
                                setWalletModalType("debit");
                                setWalletAmount("");
                                setWalletReason("Developer Balance Adjustment");
                              }}
                              title="Deduct Balance (-₹)"
                            >
                              - Debit
                            </button>

                            {/* Set Exact */}
                            <button
                              className="table-act-btn neutral"
                              onClick={() => {
                                setSelectedUser(u);
                                setWalletModalType("set");
                                setWalletAmount(String(u.walletBalance));
                                setWalletReason("Balance Set by Developer");
                              }}
                              title="Set Exact Balance"
                            >
                              Set ₹
                            </button>

                            {/* Password Reset */}
                            <button
                              className="table-act-btn warning"
                              onClick={() => {
                                setResetPasswordUser(u);
                                setNewPasswordInput("");
                                setShowPassword(false);
                              }}
                              title="Override Password"
                            >
                              🔑 Password
                            </button>

                            {/* Suspend / Unban */}
                            <button
                              className={`table-act-btn ${u.isBanned ? "success" : "neutral"}`}
                              onClick={() => handleToggleBan(u)}
                              title={u.isBanned ? "Reactivate User" : "Suspend Account"}
                            >
                              {u.isBanned ? "Unban" : "Suspend"}
                            </button>

                            {/* Toggle Developer Role */}
                            <button
                              className="table-act-btn neutral"
                              onClick={() => handleToggleDeveloper(u._id)}
                              title="Toggle Dev Role"
                            >
                              🛡️ Role
                            </button>

                            {/* Delete User */}
                            <button
                              className="table-act-btn danger icon-only"
                              onClick={() => handleDeleteUser(u)}
                              title="Delete Account"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed View */}
            <div className="cms-mobile-cards-container">
              {filteredUsers.length === 0 ? (
                <div className="empty-table-cell">No accounts match your search.</div>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u._id} className="cms-m-card user-m-card">
                    <div className="cms-m-card-header">
                      <div className="user-avatar-cell">
                        <div className="user-avatar-circle">{u.username.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="username-text">{u.username}</div>
                          <span className="email-sub">{u.email}</span>
                        </div>
                      </div>
                      <div className="cms-m-card-badges">
                        <span className={`role-pill ${u.isDeveloper ? "dev" : "student"}`}>
                          {u.isDeveloper ? "Dev" : "Student"}
                        </span>
                        <span className={`status-pill ${u.isBanned ? "suspended" : "active"}`}>
                          {u.isBanned ? "Suspended" : "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="cms-m-card-metrics">
                      <div className="m-metric-item">
                        <span className="m-metric-label">Wallet Balance</span>
                        <span className="m-metric-value highlight">₹{u.walletBalance}</span>
                      </div>
                      <div className="m-metric-item">
                        <span className="m-metric-label">Notes Authored</span>
                        <span className="m-metric-value">{u.notesCount || 0}</span>
                      </div>
                    </div>

                    <div className="cms-m-card-actions user-actions-grid">
                      <button
                        className="table-act-btn success"
                        onClick={() => {
                          setSelectedUser(u);
                          setWalletModalType("credit");
                          setWalletAmount("");
                          setWalletReason("Developer Admin Grant");
                        }}
                      >
                        + Credit
                      </button>
                      <button
                        className="table-act-btn danger"
                        onClick={() => {
                          setSelectedUser(u);
                          setWalletModalType("debit");
                          setWalletAmount("");
                          setWalletReason("Developer Balance Adjustment");
                        }}
                      >
                        - Debit
                      </button>
                      <button
                        className="table-act-btn neutral"
                        onClick={() => {
                          setSelectedUser(u);
                          setWalletModalType("set");
                          setWalletAmount(String(u.walletBalance));
                          setWalletReason("Balance Set by Developer");
                        }}
                      >
                        Set ₹
                      </button>
                      <button
                        className="table-act-btn warning"
                        onClick={() => {
                          setResetPasswordUser(u);
                          setNewPasswordInput("");
                          setShowPassword(false);
                        }}
                      >
                        🔑 Password
                      </button>
                      <button
                        className={`table-act-btn ${u.isBanned ? "success" : "neutral"}`}
                        onClick={() => handleToggleBan(u)}
                      >
                        {u.isBanned ? "Unban" : "Suspend"}
                      </button>
                      <button
                        className="table-act-btn neutral"
                        onClick={() => handleToggleDeveloper(u._id)}
                      >
                        🛡️ Role
                      </button>
                      <button
                        className="table-act-btn danger icon-only"
                        onClick={() => handleDeleteUser(u)}
                        style={{ gridColumn: "span 3" }}
                      >
                        🗑️ Delete User
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: QUIZZES CMS ================= */}
      {activeTab === "quizzes" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>🎯 Custom Quizzes & Diagram Questions</h3>
                <p>Create competitive exams with diagrams, formula images, and instant CBT mock generator.</p>
              </div>

              <div className="cms-controls-row">
                <select
                  className="modern-select"
                  value={quizFilter}
                  onChange={(e) => setQuizFilter(e.target.value)}
                >
                  <option value="ALL">All Categories ({quizzes.length})</option>
                  <option value="GATE">GATE</option>
                  <option value="UPSC">UPSC</option>
                  <option value="SSC-CGL">SSC-CGL</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General">General</option>
                </select>

                <button
                  className="cms-primary-cta"
                  onClick={() => {
                    setEditingQuizId(null);
                    setNewQuiz(defaultQuizState);
                    setShowQuizModal(true);
                  }}
                >
                  + Create New Quiz
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="modern-table-container cms-desktop-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Category</th>
                    <th>Subject & Domain</th>
                    <th>Questions</th>
                    <th>Diagrams</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-cell">
                        No custom quizzes found. Click "+ Create New Quiz" to author your first mock test!
                      </td>
                    </tr>
                  ) : (
                    filteredQuizzes.map((q) => {
                      const diagramsCount = q.questions ? q.questions.filter((i) => i.imageUrl).length : 0;
                      return (
                        <tr key={q._id}>
                          <td>
                            <strong className="table-main-title">{q.title}</strong>
                            <div className="table-sub-detail">
                              By: @{q.createdBy?.username || "Admin"} • {q.timeMinutes} mins duration
                            </div>
                          </td>
                          <td>
                            <span className="category-pill">{q.category}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: "600" }}>{q.subject}</div>
                            <span className="email-sub">{q.topic}</span>
                          </td>
                          <td style={{ fontWeight: "700" }}>
                            {q.questions ? q.questions.length : 0} Qs
                          </td>
                          <td>
                            {diagramsCount > 0 ? (
                              <span className="diagram-indicator-badge">
                                📷 {diagramsCount} Diagram{diagramsCount > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#64748b" }}>None</span>
                            )}
                          </td>
                          <td>
                            <span className={`diff-tag ${q.difficulty?.toLowerCase()}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`publish-toggle-btn ${q.isPublished ? "published" : "draft"}`}
                              onClick={() => handleTogglePublish(q._id)}
                              title="Click to toggle visibility"
                            >
                              {q.isPublished ? "● Published" : "○ Draft"}
                            </button>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons-inline" style={{ justifyContent: "flex-end" }}>
                              <button
                                className="table-act-btn neutral"
                                onClick={() => setPreviewQuiz(q)}
                                title="Preview Questions & Diagrams"
                              >
                                👁️ View
                              </button>
                              <button
                                className="table-act-btn primary"
                                onClick={() => handleOpenEditQuiz(q)}
                                title="Edit Quiz"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="table-act-btn neutral"
                                onClick={() => handleCloneQuiz(q._id)}
                                title="Duplicate Quiz"
                              >
                                📋 Clone
                              </button>
                              <button
                                className="table-act-btn danger icon-only"
                                onClick={() => handleDeleteQuiz(q._id)}
                                title="Delete Quiz"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed View */}
            <div className="cms-mobile-cards-container">
              {filteredQuizzes.length === 0 ? (
                <div className="empty-table-cell">
                  No custom quizzes found. Click "+ Create New Quiz" to author your first mock test!
                </div>
              ) : (
                filteredQuizzes.map((q) => {
                  const diagramsCount = q.questions ? q.questions.filter((i) => i.imageUrl).length : 0;
                  return (
                    <div key={q._id} className="cms-m-card quiz-m-card">
                      <div className="cms-m-card-header">
                        <div className="cms-m-card-badges">
                          <span className="category-pill">{q.category}</span>
                          <span className={`diff-tag ${q.difficulty?.toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                          {diagramsCount > 0 && (
                            <span className="diagram-indicator-badge">
                              📷 {diagramsCount} Diagram{diagramsCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <button
                          className={`publish-toggle-btn ${q.isPublished ? "published" : "draft"}`}
                          onClick={() => handleTogglePublish(q._id)}
                        >
                          {q.isPublished ? "● Published" : "○ Draft"}
                        </button>
                      </div>

                      <div className="cms-m-card-body">
                        <strong className="table-main-title" style={{ fontSize: "15px" }}>{q.title}</strong>
                        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                          <span style={{ color: "#38bdf8", fontWeight: "600" }}>{q.subject}</span> • {q.topic}
                        </div>
                        <div className="table-sub-detail" style={{ marginTop: "4px" }}>
                          ⏱️ {q.timeMinutes} mins • 📝 {q.questions ? q.questions.length : 0} Questions • By @{q.createdBy?.username || "Admin"}
                        </div>
                      </div>

                      <div className="cms-m-card-actions">
                        <button
                          className="table-act-btn neutral full-flex"
                          onClick={() => setPreviewQuiz(q)}
                        >
                          👁️ View
                        </button>
                        <button
                          className="table-act-btn primary full-flex"
                          onClick={() => handleOpenEditQuiz(q)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="table-act-btn neutral"
                          onClick={() => handleCloneQuiz(q._id)}
                        >
                          📋 Clone
                        </button>
                        <button
                          className="table-act-btn danger icon-only"
                          onClick={() => handleDeleteQuiz(q._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: CLOUDINARY MEDIA VAULT ================= */}
      {activeTab === "cloudinary" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>☁️ Cloudinary Media Vault</h3>
                <p>Direct HTTPS CDN asset uploader with automated WebP compression and worldwide edge delivery.</p>
              </div>
              <div className="engine-status-badge">
                <span className="engine-dot" />
                <span>Cloudinary Connected</span>
              </div>
            </div>

            <div className="modern-dropzone">
              <input
                type="file"
                accept="image/*"
                id="cloudinary-direct-file"
                style={{ display: "none" }}
                onChange={handleStandaloneCloudinaryUpload}
              />
              <div className="dropzone-inner" onClick={() => document.getElementById("cloudinary-direct-file").click()}>
                <div className="dropzone-icon">☁️</div>
                <h4>{uploadLoading ? "Uploading to Cloudinary CDN..." : "Click or Drag File to Upload"}</h4>
                <p>PNG, JPG, WebP, SVG, GIF up to 10MB • Direct Cloudinary optimization</p>
                <button
                  type="button"
                  className="modern-upload-btn"
                  disabled={uploadLoading}
                >
                  {uploadLoading ? "Uploading..." : "Select File From Computer"}
                </button>
              </div>
            </div>

            {uploadedUrl && (
              <div className="upload-result-card">
                <img
                  src={uploadedUrl}
                  alt="Uploaded preview"
                  className="result-thumb"
                  onClick={() => setLightboxUrl(uploadedUrl)}
                />
                <div className="result-meta">
                  <span className="success-tag">✔ Upload Successful to Cloudinary CDN</span>
                  <div className="cdn-bar">
                    <code>{uploadedUrl}</code>
                    <button
                      className="copy-mini-btn"
                      onClick={() => copyToClipboard(uploadedUrl)}
                    >
                      {copyFeedback ? "Copied! ✔" : "📋 Copy URL"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {uploadedItems.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h4 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "12px" }}>Recent Session Uploads</h4>
                <div className="asset-grid">
                  {uploadedItems.map((item, idx) => (
                    <div key={idx} className="asset-card">
                      <img src={item.url} alt={item.name} onClick={() => setLightboxUrl(item.url)} />
                      <div className="asset-footer">
                        <span className="asset-title">{item.name}</span>
                        <button className="copy-mini-btn" onClick={() => copyToClipboard(item.url)}>
                          Copy URL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: NOTES MODERATION ================= */}
      {activeTab === "notes" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>📚 Notes Moderation</h3>
                <p>Inspect student notes, verify handwriting drawings, and delete low-quality submissions.</p>
              </div>

              <div className="cms-controls-row">
                <div className="segmented-filter">
                  <button
                    className={`seg-btn ${noteFilter === "all" ? "active" : ""}`}
                    onClick={() => setNoteFilter("all")}
                  >
                    All ({notes.length})
                  </button>
                  <button
                    className={`seg-btn ${noteFilter === "public" ? "active" : ""}`}
                    onClick={() => setNoteFilter("public")}
                  >
                    Public
                  </button>
                  <button
                    className={`seg-btn ${noteFilter === "premium" ? "active" : ""}`}
                    onClick={() => setNoteFilter("premium")}
                  >
                    Premium
                  </button>
                </div>

                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="modern-search-input"
                    placeholder="Search note or author..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="modern-table-container cms-desktop-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Handwriting Drawing</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-cell">No notes found.</td>
                    </tr>
                  ) : (
                    filteredNotes.map((n) => (
                      <tr key={n._id}>
                        <td><strong className="table-main-title">{n.title}</strong></td>
                        <td>{n.userId?.username || "Unknown"}</td>
                        <td>{n.subject}</td>
                        <td>
                          <span className={`role-pill ${n.isPremium ? "dev" : "student"}`}>
                            {n.isPremium ? "Premium" : n.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td style={{ fontWeight: "700" }}>{n.isPremium ? `₹${n.price}` : "Free"}</td>
                        <td>
                          {n.handwritingImage ? (
                            <span
                              className="diagram-indicator-badge"
                              style={{ cursor: "pointer" }}
                              onClick={() => setLightboxUrl(n.handwritingImage)}
                            >
                              ✍️ Cloudinary Drawing
                            </span>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Typed</span>
                          )}
                        </td>
                        <td className="date-cell">{new Date(n.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="table-act-btn danger"
                            onClick={() => handleDeleteNote(n._id, n.title)}
                          >
                            Delete Note
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed View */}
            <div className="cms-mobile-cards-container">
              {filteredNotes.length === 0 ? (
                <div className="empty-table-cell">No notes found.</div>
              ) : (
                filteredNotes.map((n) => (
                  <div key={n._id} className="cms-m-card note-m-card">
                    <div className="cms-m-card-header">
                      <strong className="table-main-title">{n.title}</strong>
                      <span className={`role-pill ${n.isPremium ? "dev" : "student"}`}>
                        {n.isPremium ? "Premium" : n.isPublic ? "Public" : "Private"}
                      </span>
                    </div>

                    <div className="cms-m-card-body">
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Subject: <strong style={{ color: "#cbd5e1" }}>{n.subject}</strong> • By: @{n.userId?.username || "Unknown"}
                      </div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "700", color: "#10b981", fontSize: "13px" }}>
                          {n.isPremium ? `₹${n.price}` : "Free"}
                        </span>
                        {n.handwritingImage && (
                          <span
                            className="diagram-indicator-badge"
                            style={{ cursor: "pointer" }}
                            onClick={() => setLightboxUrl(n.handwritingImage)}
                          >
                            ✍️ Drawing
                          </span>
                        )}
                        <span className="date-cell" style={{ marginLeft: "auto" }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="cms-m-card-actions">
                      <button
                        className="table-act-btn danger full-flex"
                        onClick={() => handleDeleteNote(n._id, n.title)}
                      >
                        🗑️ Delete Note
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: TRANSACTIONS LEDGER ================= */}
      {activeTab === "ledger" && (
        <div className="cms-tab-content">
          <div className="cms-panel-card">
            <div className="panel-card-header">
              <div>
                <h3>🧾 System-Wide Audit Ledger</h3>
                <p>Complete record of all credits, debits, UPI withdrawals, and promotional grants.</p>
              </div>

              <div className="segmented-filter">
                <button
                  className={`seg-btn ${txFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setTxFilter("ALL")}
                >
                  All ({transactions.length})
                </button>
                <button
                  className={`seg-btn ${txFilter === "CREDIT" ? "active" : ""}`}
                  onClick={() => setTxFilter("CREDIT")}
                >
                  Credits (+₹)
                </button>
                <button
                  className={`seg-btn ${txFilter === "DEBIT" ? "active" : ""}`}
                  onClick={() => setTxFilter("DEBIT")}
                >
                  Debits (-₹)
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="modern-table-container cms-desktop-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Audit Reason</th>
                    <th>Initiator</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((tx) => txFilter === "ALL" || tx.type === txFilter)
                    .map((tx) => (
                      <tr key={tx._id}>
                        <td className="date-cell">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td>
                          <strong>{tx.user?.username || "System Account"}</strong>
                          <div className="email-sub">{tx.user?.email}</div>
                        </td>
                        <td>
                          <span className={`payout-status-badge ${tx.type === "CREDIT" ? "approved" : "rejected"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="balance-cell" style={{ color: tx.type === "CREDIT" ? "#10b981" : "#ef4444" }}>
                          {tx.type === "CREDIT" ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                        </td>
                        <td>{tx.reason}</td>
                        <td className="email-sub">
                          {tx.relatedUser?.username ? `@${tx.relatedUser.username} (Dev)` : "System"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed View */}
            <div className="cms-mobile-cards-container">
              {transactions
                .filter((tx) => txFilter === "ALL" || tx.type === txFilter)
                .map((tx) => (
                  <div key={tx._id} className="cms-m-card ledger-m-card">
                    <div className="cms-m-card-header">
                      <span className={`payout-status-badge ${tx.type === "CREDIT" ? "approved" : "rejected"}`}>
                        {tx.type}
                      </span>
                      <span className="balance-cell" style={{ color: tx.type === "CREDIT" ? "#10b981" : "#ef4444", fontSize: "16px" }}>
                        {tx.type === "CREDIT" ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </span>
                    </div>

                    <div className="cms-m-card-body">
                      <div className="username-text">{tx.user?.username || "System Account"}</div>
                      <span className="email-sub">{tx.user?.email}</span>
                      <div style={{ marginTop: "6px", fontSize: "12.5px", color: "#cbd5e1" }}>
                        Reason: <em>{tx.reason}</em>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }} className="date-cell">
                        <span>By: {tx.relatedUser?.username ? `@${tx.relatedUser.username} (Dev)` : "System"}</span>
                        <span>{new Date(tx.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: APPROVE PAYOUT MODAL ================= */}
      {approvingWithdrawal && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card">
            <div className="modal-header-strip">
              <div>
                <h3>✔ Approve & Settle Payout</h3>
                <p>Transfer amount to student's destination and record transaction reference</p>
              </div>
              <button className="modal-close-icon" onClick={() => setApprovingWithdrawal(null)}>✕</button>
            </div>

            <div className="payout-summary-box">
              <div className="payout-sum-row">
                <span>Beneficiary Student:</span>
                <strong>{approvingWithdrawal.user?.username} ({approvingWithdrawal.user?.email})</strong>
              </div>
              <div className="payout-sum-row">
                <span>Payout Amount:</span>
                <strong style={{ fontSize: "20px", color: "#10b981" }}>₹{approvingWithdrawal.amount}</strong>
              </div>
              <div className="payout-sum-row">
                <span>Payment Mode:</span>
                <span>{approvingWithdrawal.method}</span>
              </div>
              <div className="payout-sum-row">
                <span>UPI ID / Destination:</span>
                <span className="highlight-upi">{approvingWithdrawal.upiId || approvingWithdrawal.bankAccountNumber}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval}>
              <div className="modal-form-group">
                <label>UTR / Transaction Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-UTR-492819028492 or Bank IMPS Ref"
                  value={payoutRefInput}
                  onChange={(e) => setPayoutRefInput(e.target.value)}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Payout Notes (Visible to Student)</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via PhonePe / GPay"
                  value={payoutNotesInput}
                  onChange={(e) => setPayoutNotesInput(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setApprovingWithdrawal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-primary-btn green"
                  disabled={payoutActionLoading}
                >
                  {payoutActionLoading ? "Settling Payout..." : "Confirm & Settle Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: REJECT WITHDRAWAL MODAL ================= */}
      {rejectingWithdrawal && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card">
            <div className="modal-header-strip">
              <div>
                <h3>✖ Reject Payout & Refund Student</h3>
                <p>Funds will be automatically restored to the student's wallet balance.</p>
              </div>
              <button className="modal-close-icon" onClick={() => setRejectingWithdrawal(null)}>✕</button>
            </div>

            <div className="payout-summary-box warning">
              <div className="payout-sum-row">
                <span>User:</span>
                <strong>{rejectingWithdrawal.user?.username}</strong>
              </div>
              <div className="payout-sum-row">
                <span>Amount to Refund:</span>
                <strong style={{ color: "#38bdf8" }}>₹{rejectingWithdrawal.amount}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmRejection}>
              <div className="modal-form-group">
                <label>Reason for Rejection (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. Invalid or inactive UPI ID. Please check and retry."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setRejectingWithdrawal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-primary-btn red"
                  disabled={payoutActionLoading}
                >
                  {payoutActionLoading ? "Processing Refund..." : "Confirm Rejection & Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: WALLET ADJUSTMENT MODAL ================= */}
      {walletModalType && selectedUser && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card">
            <div className="modal-header-strip">
              <div>
                <h3>
                  {walletModalType === "credit" && "➕ Credit Wallet Balance"}
                  {walletModalType === "debit" && "➖ Deduct Wallet Balance"}
                  {walletModalType === "set" && "🎯 Set Exact Wallet Balance"}
                </h3>
                <p>Beneficiary: <strong>{selectedUser.username}</strong> ({selectedUser.email}) — Current Balance: ₹{selectedUser.walletBalance}</p>
              </div>
              <button className="modal-close-icon" onClick={() => setWalletModalType(null)}>✕</button>
            </div>

            <form onSubmit={handleWalletSubmit}>
              <div className="modal-form-group">
                <label>
                  {walletModalType === "set" ? "New Exact Balance (₹)" : "Transfer Amount (₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-form-group">
                <label>Audit Note / Reason for Ledger</label>
                <input
                  type="text"
                  placeholder="e.g. Scholarship prize, manual adjustment"
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setWalletModalType(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`modal-primary-btn ${walletModalType === "debit" ? "red" : "blue"}`}
                  disabled={walletLoading}
                >
                  {walletLoading ? "Updating..." : "Confirm Balance Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: PASSWORD RESET MODAL ================= */}
      {resetPasswordUser && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card">
            <div className="modal-header-strip">
              <div>
                <h3>🔑 Reset Password for {resetPasswordUser.username}</h3>
                <p>Direct bcrypt password override without requiring email OTP verification.</p>
              </div>
              <button className="modal-close-icon" onClick={() => setResetPasswordUser(null)}>✕</button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ margin: 0 }}>New Password</label>
                  <button type="button" className="inline-action-link" onClick={generateStrongPassword}>
                    🎲 Generate Strong Password
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 6 characters..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                    style={{ paddingRight: "70px" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="toggle-password-inline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setResetPasswordUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-primary-btn amber"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Updating..." : "Confirm Password Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: CREATE / EDIT CUSTOM QUIZ ================= */}
      {showQuizModal && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card large">
            <div className="modal-header-strip">
              <div>
                <h3>{editingQuizId ? "✏️ Edit Custom Quiz" : "➕ Author Custom Quiz"}</h3>
                <p>Define competitive mock questions with diagram images uploaded to Cloudinary CDN.</p>
              </div>
              <button className="modal-close-icon" onClick={() => setShowQuizModal(false)}>✕</button>
            </div>

            <form onSubmit={handleQuizSubmit}>
              <div className="form-grid-two">
                <div className="modal-form-group">
                  <label>Quiz Title</label>
                  <input
                    type="text"
                    placeholder="e.g. GATE CS 2026: Algorithms Special Mock"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Category</label>
                  <select
                    className="modern-select full-width"
                    value={newQuiz.category}
                    onChange={(e) => setNewQuiz({ ...newQuiz, category: e.target.value })}
                  >
                    <option value="GATE">GATE</option>
                    <option value="UPSC">UPSC</option>
                    <option value="SSC-CGL">SSC-CGL</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-three">
                <div className="modal-form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures"
                    value={newQuiz.subject}
                    onChange={(e) => setNewQuiz({ ...newQuiz, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Topic / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Search Trees"
                    value={newQuiz.topic}
                    onChange={(e) => setNewQuiz({ ...newQuiz, topic: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Time (Minutes)</label>
                  <input
                    type="number"
                    min="3"
                    max="180"
                    value={newQuiz.timeMinutes}
                    onChange={(e) => setNewQuiz({ ...newQuiz, timeMinutes: e.target.value })}
                  />
                </div>
              </div>

              {/* QUESTIONS BUILDER WITH DIAGRAM UPLOADER */}
              <div className="questions-section-header">
                <h4>Quiz Questions ({newQuiz.questions.length})</h4>
                <button
                  type="button"
                  className="modern-sub-btn"
                  onClick={addQuestionField}
                >
                  + Add Question
                </button>
              </div>

              {newQuiz.questions.map((q, idx) => (
                <div key={idx} className="question-builder-item">
                  <div className="builder-top-row">
                    <span className="q-number-pill">Question #{idx + 1}</span>
                    <button
                      type="button"
                      className="inline-delete-link"
                      onClick={() => removeQuestionField(idx)}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="modal-form-group">
                    <label>Question Statement / Prompt</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. In the following binary search tree diagram, what is the height after balance rotation?"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...newQuiz.questions];
                        updated[idx].question = e.target.value;
                        setNewQuiz({ ...newQuiz, questions: updated });
                      }}
                      required
                    />
                  </div>

                  {/* DIAGRAM UPLOADER */}
                  <div className="question-diagram-zone">
                    <div className="diagram-zone-header">
                      <span className="diagram-label">📷 Question Diagram / Formula Image (Cloudinary CDN)</span>
                      {q.imageUrl && (
                        <button
                          type="button"
                          className="remove-diagram-btn"
                          onClick={() => {
                            const updated = [...newQuiz.questions];
                            updated[idx].imageUrl = "";
                            setNewQuiz({ ...newQuiz, questions: updated });
                          }}
                        >
                          Remove Diagram
                        </button>
                      )}
                    </div>

                    {q.imageUrl ? (
                      <div className="diagram-preview-strip">
                        <img
                          src={q.imageUrl}
                          alt="Diagram preview"
                          onClick={() => setLightboxUrl(q.imageUrl)}
                        />
                        <div className="diagram-strip-meta">
                          <span className="cdn-ready-tag">✔ Cloudinary CDN Linked</span>
                          <span className="cdn-url-snippet">{q.imageUrl}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="diagram-upload-inputs">
                        <input
                          type="file"
                          accept="image/*"
                          id={`q-diagram-file-${idx}`}
                          style={{ display: "none" }}
                          onChange={(e) => handleQuestionImageUpload(e, idx)}
                        />
                        <button
                          type="button"
                          className="modern-sub-btn"
                          disabled={uploadingQuestionIdx === idx}
                          onClick={() => document.getElementById(`q-diagram-file-${idx}`).click()}
                        >
                          {uploadingQuestionIdx === idx ? "Uploading to Cloudinary..." : "📁 Upload Diagram File"}
                        </button>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>or paste image URL:</span>
                        <input
                          type="url"
                          placeholder="https://res.cloudinary.com/... or any URL"
                          value={q.imageUrl || ""}
                          onChange={(e) => {
                            const updated = [...newQuiz.questions];
                            updated[idx].imageUrl = e.target.value;
                            setNewQuiz({ ...newQuiz, questions: updated });
                          }}
                          style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="options-grid-two">
                    {[0, 1, 2, 3].map((optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        value={q.options[optIdx] || ""}
                        onChange={(e) => {
                          const updated = [...newQuiz.questions];
                          const newOpts = [...(updated[idx].options || ["", "", "", ""])];
                          newOpts[optIdx] = e.target.value;
                          updated[idx].options = newOpts;
                          setNewQuiz({ ...newQuiz, questions: updated });
                        }}
                        required
                      />
                    ))}
                  </div>

                  <div className="form-grid-two" style={{ marginTop: "10px" }}>
                    <div className="modal-form-group" style={{ margin: 0 }}>
                      <label>Correct Answer (Exact option match)</label>
                      <input
                        type="text"
                        placeholder="e.g. O(log n)"
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const updated = [...newQuiz.questions];
                          updated[idx].correctAnswer = e.target.value;
                          setNewQuiz({ ...newQuiz, questions: updated });
                        }}
                        required
                      />
                    </div>
                    <div className="modal-form-group" style={{ margin: 0 }}>
                      <label>Explanation / Solution Concept</label>
                      <input
                        type="text"
                        placeholder="e.g. Balanced BST tree height is O(log n)"
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...newQuiz.questions];
                          updated[idx].explanation = e.target.value;
                          setNewQuiz({ ...newQuiz, questions: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setShowQuizModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-primary-btn blue">
                  {editingQuizId ? "Save Quiz Changes" : "Publish Quiz to Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: PREVIEW QUIZ MODAL ================= */}
      {previewQuiz && (
        <div className="modern-modal-backdrop">
          <div className="modern-modal-card large">
            <div className="modal-header-strip">
              <div>
                <span className="category-pill">{previewQuiz.category}</span>
                <h3 style={{ margin: "6px 0 2px" }}>{previewQuiz.title}</h3>
                <p>{previewQuiz.subject} • {previewQuiz.topic} • {previewQuiz.difficulty} Difficulty</p>
              </div>
              <button className="modal-close-icon" onClick={() => setPreviewQuiz(null)}>✕</button>
            </div>

            <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "6px" }}>
              {previewQuiz.questions?.map((q, qIdx) => (
                <div key={qIdx} className="preview-question-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="q-number-pill">Question #{qIdx + 1}</span>
                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700" }}>Correct: {q.correctAnswer}</span>
                  </div>

                  <p style={{ margin: "10px 0 12px", fontSize: "15px", fontWeight: "600" }}>{q.question}</p>

                  {q.imageUrl && (
                    <div className="preview-diagram-box">
                      <img src={q.imageUrl} alt="Question diagram" onClick={() => setLightboxUrl(q.imageUrl)} />
                      <span style={{ fontSize: "11px", color: "#38bdf8", marginTop: "6px" }}>📷 Attached Diagram</span>
                    </div>
                  )}

                  <div className="options-grid-two">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = opt === q.correctAnswer;
                      return (
                        <div key={oIdx} className={`preview-opt-item ${isCorrect ? "correct" : ""}`}>
                          <span className="opt-letter-tag">{String.fromCharCode(65 + oIdx)}</span>
                          <span>{opt}</span>
                          {isCorrect && <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700" }}>✔ Correct</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setPreviewQuiz(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="modal-primary-btn blue"
                onClick={() => {
                  const target = previewQuiz;
                  setPreviewQuiz(null);
                  handleOpenEditQuiz(target);
                }}
              >
                Edit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: IMAGE LIGHTBOX ================= */}
      {lightboxUrl && (
        <div className="modern-lightbox-backdrop" onClick={() => setLightboxUrl(null)}>
          <div className="lightbox-center-card" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Enlarged preview" />
            <button className="lightbox-dismiss-btn" onClick={() => setLightboxUrl(null)}>
              ✕ Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
