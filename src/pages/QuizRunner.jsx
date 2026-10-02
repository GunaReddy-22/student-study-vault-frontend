import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { submitQuizAttempt } from "../services/quizApi";
import FormattedMathText from "../components/FormattedMathText";
import QuestionDiagram from "../components/QuestionDiagram";
import "./quizRunner.css";

export default function QuizRunner() {
  const navigate = useNavigate();

  // Load active quiz from sessionStorage
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optionIndex }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qIdx]: true/false }

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timeSpentRef = useRef(0);

  // States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [viewingSolution, setViewingSolution] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const runnerRef = useRef(null);

  /* ===============================
     INITIALIZE QUIZ
  =============================== */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("active_quiz");
      if (!stored) {
        navigate("/quizzes");
        return;
      }
      const parsed = JSON.parse(stored);
      setQuizData(parsed);
      const totalSec = (parsed.timeLimitMinutes || 10) * 60;
      setSecondsLeft(totalSec);
    } catch {
      navigate("/quizzes");
    }
  }, [navigate]);

  /* ===============================
     FULLSCREEN TOGGLE
  =============================== */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      runnerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  /* ===============================
     SUBMIT QUIZ HANDLER
  =============================== */
  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData || submitting || resultData) return;
    try {
      setSubmitting(true);
      setIsTimerRunning(false);

      const evaluatedQuestions = quizData.questions.map((q, idx) => ({
        question: q.question,
        options: q.options,
        selectedAnswer: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

      const payload = {
        examType: quizData.examName || quizData.examId,
        subject: quizData.subject,
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        totalQuestions: quizData.questions.length,
        questions: evaluatedQuestions,
        timeSpentSeconds: timeSpentRef.current,
      };

      const res = await submitQuizAttempt(payload);
      if (res.success) {
        setResultData(res.result);
        setShowSubmitModal(false);
      } else {
        alert("Failed to evaluate submission");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      // Client-side fallback evaluation
      let correct = 0;
      const evaluated = quizData.questions.map((q, idx) => {
        const sel = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
        const isCorr = sel === q.correctAnswer;
        if (isCorr) correct++;
        return {
          question: q.question,
          options: q.options,
          selectedAnswer: sel,
          correctAnswer: q.correctAnswer,
          isCorrect: isCorr,
          explanation: q.explanation,
        };
      });
      const total = quizData.questions.length;
      const acc = Math.round((correct / total) * 100);
      setResultData({
        totalQuestions: total,
        correctAnswers: correct,
        incorrectAnswers: total - correct,
        score: correct * 4,
        accuracy: acc,
        timeSpentSeconds: timeSpentRef.current,
        performanceGrade: acc >= 75 ? "Excellent 🌟" : acc >= 50 ? "Good Job 🚀" : "Keep Practicing 💡",
        questions: evaluated,
      });
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  }, [quizData, submitting, resultData, selectedAnswers]);

  /* ===============================
     TIMER COUNTDOWN
  =============================== */
  useEffect(() => {
    if (!isTimerRunning || resultData) return;

    const timer = setInterval(() => {
      timeSpentRef.current += 1;
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, resultData, handleSubmitQuiz]);

  /* ===============================
     KEYBOARD NAVIGATION
  =============================== */
  useEffect(() => {
    if (resultData || showSubmitModal) return;

    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toUpperCase() : "";
      if (["1", "A"].includes(key)) {
        setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: 0 }));
      } else if (["2", "B"].includes(key)) {
        setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: 1 }));
      } else if (["3", "C"].includes(key)) {
        setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: 2 }));
      } else if (["4", "D"].includes(key)) {
        setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: 3 }));
      } else if (e.key === "ArrowRight") {
        if (quizData && currentIdx < quizData.questions.length - 1) {
          setCurrentIdx((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentIdx > 0) {
          setCurrentIdx((i) => i - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, quizData, resultData, showSubmitModal]);

  if (!quizData) return null;

  const currentQ = quizData.questions[currentIdx];
  const totalQ = quizData.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = totalQ - answeredCount;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleOptionSelect = (optIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));
  };

  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx],
    }));
  };

  /* ===============================
     RENDER SCORECARD & RESULT
  =============================== */
  if (resultData) {
    return (
      <div className="quiz-result-view">
        <div className="result-card">
          <div className="result-header">
            <span className="res-badge">Test Completed</span>
            <h2>{quizData.topic || quizData.examName} Mock Results</h2>
            <p className="res-grade">{resultData.performanceGrade}</p>
          </div>

          {/* METRICS ROW */}
          <div className="score-metrics-grid">
            <div className="metric-box score">
              <span className="metric-val">{resultData.score}</span>
              <span className="metric-label">Total Score</span>
            </div>
            <div className="metric-box accuracy">
              <span className="metric-val">{resultData.accuracy}%</span>
              <span className="metric-label">Accuracy Rate</span>
            </div>
            <div className="metric-box correct">
              <span className="metric-val">
                {resultData.correctAnswers} / {resultData.totalQuestions}
              </span>
              <span className="metric-label">Correct Answers</span>
            </div>
            <div className="metric-box time">
              <span className="metric-val">{formatTimer(resultData.timeSpentSeconds || timeSpentRef.current)}</span>
              <span className="metric-label">Time Spent</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="result-actions">
            <button
              className="btn-secondary"
              onClick={() => setViewingSolution((prev) => !prev)}
            >
              {viewingSolution ? "Hide Solutions" : "📖 Review Detailed Solutions"}
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate("/quizzes")}
            >
              🎯 Practice More Topics
            </button>
          </div>

          {/* DETAILED SOLUTION REVIEW */}
          {viewingSolution && (
            <div className="solutions-container">
              <h3>Detailed Question-by-Question Solutions</h3>
              {resultData.questions.map((q, idx) => {
                const isCorrect = q.isCorrect;
                const isSkipped = q.selectedAnswer === -1;
                return (
                  <div
                    key={idx}
                    className={`solution-item ${
                      isCorrect ? "correct-sol" : isSkipped ? "skipped-sol" : "wrong-sol"
                    }`}
                  >
                    <div className="sol-q-header">
                      <span className="sol-num">Question {idx + 1}</span>
                      <span className="sol-status">
                        {isCorrect ? "✅ Correct (+4)" : isSkipped ? "⚪ Skipped (0)" : "❌ Incorrect (-1)"}
                      </span>
                    </div>

                    <div className="sol-q-text">
                      <FormattedMathText text={q.question} />
                    </div>

                    {/* Uploaded / Attached Diagram or Figure */}
                    {q.imageUrl && (
                      <div className="custom-question-img-box">
                        <img
                          src={q.imageUrl}
                          alt="Question figure"
                          className="quiz-diagram-img"
                          onClick={() => window.open(q.imageUrl, "_blank")}
                        />
                      </div>
                    )}

                    {/* Diagram in Solution */}
                    <QuestionDiagram
                      diagramSvg={q.diagramSvg}
                      diagramType={q.diagramType}
                      questionText={q.question}
                    />

                    <div className="sol-options-grid">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOpt = oIdx === q.correctAnswer;
                        const isSelectedOpt = oIdx === q.selectedAnswer;
                        let optClass = "";
                        if (isCorrectOpt) optClass = "is-correct-opt";
                        if (isSelectedOpt && !isCorrectOpt) optClass = "is-wrong-opt";

                        return (
                          <div key={oIdx} className={`sol-opt-row ${optClass}`}>
                            <span className="opt-letter">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="opt-text">
                              <FormattedMathText text={opt} />
                            </span>
                            {isCorrectOpt && <span className="opt-badge">✔ Correct Answer</span>}
                            {isSelectedOpt && !isCorrectOpt && <span className="opt-badge wrong">Your Selection</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="explanation-box">
                        <strong>💡 Concept & Explanation:</strong>
                        <FormattedMathText text={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ===============================
     RENDER CBT TEST RUNNER
  =============================== */
  return (
    <div ref={runnerRef} className={`cbt-quiz-container ${isFullscreen ? "fullscreen" : ""}`}>
      {/* =========================================
          TOP EXAM BAR
      ========================================= */}
      <div className="cbt-header-bar">
        <div className="cbt-exam-title">
          <span className="exam-tag">{quizData.examName}</span>
          <span className="topic-title">{quizData.topic}</span>
        </div>

        {/* TIMER DISPLAY */}
        <div className={`cbt-timer ${secondsLeft < 60 ? "urgent" : ""}`}>
          <span className="timer-icon">⏱</span>
          <span className="timer-val">{formatTimer(secondsLeft)}</span>
        </div>

        <div className="cbt-header-actions">
          {/* Mobile Palette Drawer Toggle */}
          <button
            className="cbt-mobile-palette-btn"
            onClick={() => setPaletteOpen((prev) => !prev)}
            title="Open Question Palette"
          >
            📊 {currentIdx + 1}/{totalQ}
          </button>

          <button
            className="cbt-fs-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Test Mode"}
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
          <button
            className="cbt-submit-btn"
            onClick={() => setShowSubmitModal(true)}
          >
            Finish Test 🏁
          </button>
        </div>
      </div>

      {/* =========================================
          MAIN TEST BODY
      ========================================= */}
      <div className="cbt-layout-body">
        {/* LEFT / CENTER: QUESTION CONTAINER */}
        <div className="cbt-question-area">
          <div className="question-card">
            <div className="question-header">
              <span className="q-badge">Question {currentIdx + 1} of {totalQ}</span>
              <div className="q-meta">
                <span className="diff-tag">{quizData.difficulty}</span>
                {markedForReview[currentIdx] && <span className="review-flag-tag">🚩 Marked for Review</span>}
              </div>
            </div>

            {/* QUESTION STATEMENT WITH FORMULAS */}
            <div className="question-text">
              <FormattedMathText text={currentQ.question} />
            </div>

            {/* ATTACHED QUESTION FIGURE / DIAGRAM */}
            {currentQ.imageUrl && (
              <div className="question-custom-image-box">
                <img
                  src={currentQ.imageUrl}
                  alt={`Question ${currentIdx + 1} Diagram`}
                  className="question-card-diagram-img"
                  onClick={() => window.open(currentQ.imageUrl, "_blank")}
                  title="Click to view full image in new tab"
                />
                <span className="diagram-zoom-hint">🔍 Click image to enlarge full size</span>
              </div>
            )}

            {/* DIAGRAM / SCHEMATIC FIGURE */}
            <QuestionDiagram
              diagramSvg={currentQ.diagramSvg}
              diagramType={currentQ.diagramType}
              questionText={currentQ.question}
            />

            {/* OPTIONS */}
            <div className="options-list">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <div
                    key={optIdx}
                    className={`option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(optIdx)}
                  >
                    <div className="opt-key-badge">{letter}</div>
                    <div className="opt-text">
                      <FormattedMathText text={opt} />
                    </div>
                    <div className="opt-radio">
                      <div className="radio-inner" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM CONTROLS */}
          <div className="cbt-question-footer">
            <div className="footer-left">
              <button
                className={`review-toggle-btn ${markedForReview[currentIdx] ? "active" : ""}`}
                onClick={handleToggleReview}
              >
                🚩 {markedForReview[currentIdx] ? "Unmark" : "Mark Review"}
              </button>
              {selectedAnswers[currentIdx] !== undefined && (
                <button className="clear-btn" onClick={handleClearResponse}>
                  ↺ Clear
                </button>
              )}
            </div>

            <div className="footer-right">
              <button
                className="nav-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
              >
                ◀ Prev
              </button>
              {currentIdx < totalQ - 1 ? (
                <button
                  className="nav-btn primary"
                  onClick={() => setCurrentIdx((i) => i + 1)}
                >
                  Next ▶
                </button>
              ) : (
                <button
                  className="nav-btn submit-final"
                  onClick={() => setShowSubmitModal(true)}
                >
                  Submit 🏁
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE PALETTE BACKDROP */}
        {paletteOpen && (
          <div
            className="palette-mobile-overlay"
            onClick={() => setPaletteOpen(false)}
          />
        )}

        {/* RIGHT SIDEBAR / MOBILE DRAWER: QUESTION PALETTE */}
        <div className={`cbt-sidebar-palette ${paletteOpen ? "mobile-open" : ""}`}>
          <div className="palette-header">
            <h4>Question Palette</h4>
            <button
              className="palette-close-mobile-btn"
              onClick={() => setPaletteOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* STATUS LEGEND */}
          <div className="palette-legend">
            <div className="legend-item">
              <span className="dot answered" />
              <span>{answeredCount} Answered</span>
            </div>
            <div className="legend-item">
              <span className="dot unanswered" />
              <span>{unansweredCount} Unanswered</span>
            </div>
            <div className="legend-item">
              <span className="dot marked" />
              <span>{markedCount} Marked Review</span>
            </div>
          </div>

          {/* NUMBER GRID */}
          <div className="palette-grid">
            {quizData.questions.map((_, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isMarked = markedForReview[idx];

              let statusClass = "unanswered";
              if (isAnswered && isMarked) statusClass = "answered-marked";
              else if (isAnswered) statusClass = "answered";
              else if (isMarked) statusClass = "marked";

              return (
                <button
                  key={idx}
                  className={`palette-num-btn ${statusClass} ${isCurrent ? "current" : ""}`}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setPaletteOpen(false);
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================
          SUBMIT CONFIRMATION MODAL
      ========================================= */}
      {showSubmitModal && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowSubmitModal(false)}>
          <div className="submit-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="submit-modal-header">
              <h3>Confirm Test Submission</h3>
              <button className="close-modal-btn" onClick={() => setShowSubmitModal(false)}>
                ✕
              </button>
            </div>

            <div className="submit-modal-body">
              <p>Are you sure you want to end this mock test?</p>

              <div className="submit-summary-table">
                <div className="sum-row">
                  <span>Total Questions:</span>
                  <strong>{totalQ}</strong>
                </div>
                <div className="sum-row green">
                  <span>Answered:</span>
                  <strong>{answeredCount}</strong>
                </div>
                <div className="sum-row orange">
                  <span>Marked for Review:</span>
                  <strong>{markedCount}</strong>
                </div>
                <div className="sum-row gray">
                  <span>Unanswered:</span>
                  <strong>{unansweredCount}</strong>
                </div>
              </div>
            </div>

            <div className="submit-modal-footer">
              <button
                className="cancel-btn"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Return to Test
              </button>
              <button
                className="confirm-submit-btn"
                disabled={submitting}
                onClick={handleSubmitQuiz}
              >
                {submitting ? "Evaluating..." : "Yes, Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
