import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizCategories, getUserQuizHistory, generateQuizQuestions } from "../services/quizApi";
import "./practiceQuizzes.css";

export default function PracticeQuizzes() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genStatusText, setGenStatusText] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // User Stats & History
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const catRes = await getQuizCategories();
        if (catRes.success) {
          setCategories(catRes.categories || []);
        }

        try {
          const histRes = await getUserQuizHistory();
          if (histRes.success) {
            setStats(histRes.stats);
            setHistory(histRes.history || []);
          }
        } catch {
          // non-blocking if guest
        }
      } catch (err) {
        console.error("Failed to load quiz categories", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenConfig = (exam, subject = null, topic = null) => {
    setSelectedExam(exam);
    const sub = subject || exam.subjects[0];
    setSelectedSubject(sub);
    setSelectedTopic(topic || (sub && sub.topics ? sub.topics[0] : "General"));
    setShowConfigModal(true);
  };

  const handleStartQuiz = async () => {
    if (!selectedExam || !selectedTopic) return;
    try {
      setGenerating(true);
      setGenStatusText("Generating authentic exam questions with AI...");

      const res = await generateQuizQuestions({
        examId: selectedExam.id,
        examName: selectedExam.name,
        subject: selectedSubject ? selectedSubject.name : "General",
        topic: selectedTopic,
        difficulty,
        count: questionCount,
      });

      if (res.success && res.quiz) {
        setShowConfigModal(false);
        // Store quiz in sessionStorage and navigate
        sessionStorage.setItem("active_quiz", JSON.stringify(res.quiz));
        navigate("/quizzes/test");
      } else {
        alert("Failed to create quiz questions. Please try again.");
      }
    } catch (err) {
      console.error("Quiz generation failed:", err);
      alert(err.response?.data?.message || "Could not generate quiz. Please check backend connection.");
    } finally {
      setGenerating(false);
      setGenStatusText("");
    }
  };

  const filteredCategories =
    activeTab === "all"
      ? categories
      : categories.filter((c) => c.id === activeTab || c.badge.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <div className="practice-quiz-page">
      {/* =========================================
          HERO BANNER
      ========================================= */}
      <div className="quiz-hero-banner">
        <div className="hero-badge">🎯 Free AI & CBT Exam Practice</div>
        <h1>Master Competitive Exams with Instant Practice Mock Tests</h1>
        <p>
          AI-generated and open-bank MCQs for <strong>GATE, JEE, NEET, Software Engineering & Placements</strong>. Full solutions, instant feedback, and CBT interface.
        </p>

        {/* STATS STRIP */}
        {stats && (
          <div className="user-stats-strip">
            <div className="stat-pill">
              <span className="stat-num">{stats.totalTests}</span>
              <span className="stat-lbl">Tests Taken</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{stats.avgAccuracy}%</span>
              <span className="stat-lbl">Avg Accuracy</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{stats.highestScore}</span>
              <span className="stat-lbl">Best Score</span>
            </div>
            {history.length > 0 && (
              <button className="view-history-btn" onClick={() => setShowHistoryModal(true)}>
                📜 Past Attempts
              </button>
            )}
          </div>
        )}
      </div>

      {/* =========================================
          CATEGORY FILTER TABS
      ========================================= */}
      <div className="quiz-tabs-bar">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          🌟 All Categories
        </button>
        <button
          className={`tab-btn ${activeTab === "jee" ? "active" : ""}`}
          onClick={() => setActiveTab("jee")}
        >
          📐 JEE (Main/Adv)
        </button>
        <button
          className={`tab-btn ${activeTab === "neet" ? "active" : ""}`}
          onClick={() => setActiveTab("neet")}
        >
          🧬 NEET Medical
        </button>
        <button
          className={`tab-btn ${activeTab === "gate-cs" ? "active" : ""}`}
          onClick={() => setActiveTab("gate-cs")}
        >
          💻 GATE CS / IT
        </button>
        <button
          className={`tab-btn ${activeTab === "aptitude" ? "active" : ""}`}
          onClick={() => setActiveTab("aptitude")}
        >
          📊 Placements & Aptitude
        </button>
        <button
          className={`tab-btn ${activeTab === "coding" ? "active" : ""}`}
          onClick={() => setActiveTab("coding")}
        >
          ⚡ Coding & Tech
        </button>
        <button
          className={`tab-btn ${activeTab === "opentdb" ? "active" : ""}`}
          onClick={() => setActiveTab("opentdb")}
        >
          🌐 Open Trivia API
        </button>
      </div>

      {/* =========================================
          EXAM & TOPICS GRID
      ========================================= */}
      {loading ? (
        <div className="quiz-loading-state">
          <div className="spinner-orbit"></div>
          <p>Loading exam categories and question banks...</p>
        </div>
      ) : (
        <div className="exam-cards-grid">
          {filteredCategories.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-card-header">
                <div className="exam-icon-wrap">{exam.icon}</div>
                <div className="exam-info">
                  <span className="exam-badge">{exam.badge}</span>
                  <h3>{exam.name}</h3>
                </div>
              </div>

              <p className="exam-desc">{exam.description}</p>

              {/* Compact Subject Summary Badges */}
              <div className="subjects-summary-wrap">
                {exam.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="subject-badge-pill">
                    <span className="sub-dot">📌</span>
                    <span className="sub-name">{sub.name}</span>
                    <span className="sub-count">{sub.topics.length} Chapters</span>
                  </div>
                ))}
              </div>

              {/* Sample Popular Chapters Preview (max 3) */}
              <div className="sample-chapters-row">
                <span className="sample-lbl">Popular:</span>
                {exam.subjects[0]?.topics.slice(0, 3).map((top, tIdx) => (
                  <button
                    key={tIdx}
                    className="sample-top-chip"
                    onClick={() => handleOpenConfig(exam, exam.subjects[0], top)}
                  >
                    {top}
                  </button>
                ))}
              </div>

              <div className="exam-card-footer">
                <button
                  className="quick-start-btn"
                  onClick={() => handleOpenConfig(exam)}
                >
                  ⚡ Select Chapter & Start Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================
          TEST CONFIGURATION MODAL
      ========================================= */}
      {showConfigModal && selectedExam && (
        <div className="modal-backdrop" onClick={() => !generating && setShowConfigModal(false)}>
          <div className="config-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-icon">{selectedExam.icon}</span>
                <div>
                  <h3>Configure Practice Mock</h3>
                  <span className="modal-sub">{selectedExam.name}</span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                disabled={generating}
                onClick={() => setShowConfigModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="config-body">
              {/* Subject Selection */}
              <div className="config-field">
                <label>Subject</label>
                <select
                  value={selectedSubject ? selectedSubject.name : ""}
                  onChange={(e) => {
                    const found = selectedExam.subjects.find((s) => s.name === e.target.value);
                    setSelectedSubject(found);
                    if (found && found.topics.length > 0) {
                      setSelectedTopic(found.topics[0]);
                    }
                  }}
                  disabled={generating}
                >
                  {selectedExam.subjects.map((s, i) => (
                    <option key={i} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Selection */}
              {selectedSubject && (
                <div className="config-field">
                  <label>Topic / Domain</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={generating}
                  >
                    {selectedSubject.topics.map((t, i) => (
                      <option key={i} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty */}
              <div className="config-field">
                <label>Difficulty Level</label>
                <div className="difficulty-segmented">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`diff-opt ${difficulty === d ? "active " + d.toLowerCase() : ""}`}
                      onClick={() => setDifficulty(d)}
                      disabled={generating}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="config-field">
                <label>Questions Count</label>
                <div className="count-segmented">
                  {[5, 10, 15, 20].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`count-opt ${questionCount === c ? "active" : ""}`}
                      onClick={() => setQuestionCount(c)}
                      disabled={generating}
                    >
                      {c} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="info-badge-row">
                <span>⏱ Estimated Time: ~{Math.ceil(questionCount * 1.5)} mins</span>
                <span>🎯 Marking Scheme: +4 / -1</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowConfigModal(false)}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                className="launch-quiz-btn"
                onClick={handleStartQuiz}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="btn-spinner" />
                    <span>{genStatusText || "Generating Test..."}</span>
                  </>
                ) : (
                  "🚀 Launch Test Simulator"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          PAST ATTEMPTS / HISTORY MODAL
      ========================================= */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="history-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 Your Past Quiz Attempts</h3>
              <button className="close-modal-btn" onClick={() => setShowHistoryModal(false)}>
                ✕
              </button>
            </div>

            <div className="history-list">
              {history.length === 0 ? (
                <p className="no-history">No attempts recorded yet. Start a quiz to track your growth!</p>
              ) : (
                history.map((att) => (
                  <div key={att._id} className="history-item">
                    <div className="hist-main">
                      <span className="hist-exam">{att.examType}</span>
                      <h4 className="hist-topic">{att.topic || att.subject}</h4>
                      <span className="hist-date">
                        {new Date(att.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="hist-score-wrap">
                      <div className="hist-score">
                        {att.correctAnswers} / {att.totalQuestions}
                      </div>
                      <div
                        className={`hist-acc-badge ${
                          att.accuracy >= 70 ? "high" : att.accuracy >= 40 ? "med" : "low"
                        }`}
                      >
                        {att.accuracy}% Accuracy
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
