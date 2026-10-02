import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { generateQuiz, evaluateQuiz, getQuizHistory } from "../services/ai";
import "./QuizModal.css";
import {
  FaBrain,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
  FaRedo,
  FaChevronRight,
  FaChevronLeft,
  FaHistory,
  FaChartLine,
  FaGraduationCap,
  FaTimes,
  FaArrowRight,
} from "react-icons/fa";

export default function QuizModal({ noteId, noteTitle, noteSubject, onClose }) {
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: "user answer" }
  const [showHint, setShowHint] = useState(false);

  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState("quiz"); // "quiz" | "scorecard" | "history"
  const [resultFilter, setResultFilter] = useState("all"); // "all" | "correct" | "incorrect"

  /* ==================================================
     1. INITIAL LOAD: GENERATE QUIZ
  ================================================== */
  useEffect(() => {
    loadQuiz();
  }, [noteId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
    setAnswers({});
    setCurrentIdx(0);
    setViewMode("quiz");

    try {
      const data = await generateQuiz(noteId);
      if (data && data.questions && data.questions.length > 0) {
        setQuiz(data);
      } else {
        throw new Error("No questions returned by AI.");
      }
    } catch (err) {
      console.error("Quiz load failed:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate quiz. Please make sure the note has sufficient content.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ==================================================
     2. ANSWER HANDLING
  ================================================== */
  const handleSelectOption = (qId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleBlankInput = (qId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: text,
    }));
  };

  /* ==================================================
     3. SUBMIT QUIZ FOR EVALUATION
  ================================================== */
  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.questions) return;

    // Check unanswered questions
    const unansweredCount = quiz.questions.filter(
      (q) => !answers[q.id] || !answers[q.id].trim()
    ).length;

    if (unansweredCount > 0) {
      const proceed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!proceed) return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const userAnswersList = quiz.questions.map((q) => ({
        questionId: q.id,
        userAnswer: (answers[q.id] || "").trim(),
      }));

      const evalResult = await evaluateQuiz({
        noteId,
        questions: quiz.questions,
        userAnswers: userAnswersList,
      });

      setEvaluation(evalResult);
      setViewMode("scorecard");
    } catch (err) {
      console.error("Evaluation failed:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to evaluate quiz. Please try again.";
      setError(msg);
    } finally {
      setEvaluating(false);
    }
  };

  /* ==================================================
     4. FETCH HISTORY
  ================================================== */
  const handleShowHistory = async () => {
    try {
      const records = await getQuizHistory(noteId);
      setHistory(records);
      setViewMode("history");
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // Current question data
  const currentQ = quiz?.questions?.[currentIdx];
  const progressPercent = quiz?.questions
    ? Math.round(((currentIdx + 1) / quiz.questions.length) * 100)
    : 0;

  return createPortal(
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div
        className="quiz-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP NAVBAR */}
        <div className="quiz-header">
          <div className="quiz-header-left">
            <span className="quiz-badge">
              <FaBrain className="quiz-badge-icon" /> AI Assessment
            </span>
            <div className="quiz-title-wrap">
              <h3 className="quiz-note-title">
                {noteTitle || "Note Knowledge Check"}
              </h3>
              {noteSubject && (
                <span className="quiz-subject-tag">{noteSubject}</span>
              )}
            </div>
          </div>

          <div className="quiz-header-right">
            {viewMode === "quiz" && (
              <button
                className="quiz-header-btn"
                onClick={handleShowHistory}
                title="View Past Attempts"
              >
                <FaHistory /> History
              </button>
            )}
            {viewMode === "history" && (
              <button
                className="quiz-header-btn"
                onClick={() => setViewMode(evaluation ? "scorecard" : "quiz")}
              >
                <FaArrowRight /> Back to Quiz
              </button>
            )}
            <button className="quiz-close-btn" onClick={onClose} title="Close">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="quiz-modal-body">
          {/* STATE A: LOADING QUIZ */}
          {loading && (
            <div className="quiz-loading-state">
              <div className="quiz-ai-spinner">
                <FaBrain className="pulsing-brain" />
                <div className="spinner-ring"></div>
              </div>
              <h4>Crafting Your AI Quiz...</h4>
              <p>
                Analyzing note concepts, synthesizing multiple-choice and
                fill-in-the-blank questions.
              </p>
            </div>
          )}

          {/* STATE B: EVALUATING */}
          {evaluating && (
            <div className="quiz-loading-state">
              <div className="quiz-ai-spinner eval-spinner">
                <FaGraduationCap className="pulsing-brain" />
                <div className="spinner-ring ring-teal"></div>
              </div>
              <h4>Grading Answers & Analyzing Performance...</h4>
              <p>
                StudyVault AI is assessing semantic accuracy and compiling
                targeted improvement areas for you.
              </p>
            </div>
          )}

          {/* STATE C: ERROR */}
          {!loading && !evaluating && error && (
            <div className="quiz-error-state">
              <div className="error-icon">⚠️</div>
              <h4>Oops! Something went wrong</h4>
              <p>{error}</p>
              <div className="quiz-error-actions">
                <button className="quiz-primary-btn" onClick={loadQuiz}>
                  <FaRedo /> Try Again
                </button>
                <button className="quiz-secondary-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* STATE D: ACTIVE QUIZ TAKING */}
          {!loading && !evaluating && !error && viewMode === "quiz" && quiz && (
            <div className="quiz-active-view">
              {/* PROGRESS BAR */}
              <div className="quiz-progress-section">
                <div className="quiz-progress-text">
                  <span>
                    Question <strong>{currentIdx + 1}</strong> of{" "}
                    <strong>{quiz.questions.length}</strong>
                  </span>
                  <span className="quiz-progress-percent">
                    {progressPercent}% Complete
                  </span>
                </div>
                <div className="quiz-progress-track">
                  <div
                    className="quiz-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* QUESTION CARD */}
              {currentQ && (
                <div className="quiz-question-card">
                  <div className="quiz-q-meta">
                    <span
                      className={`quiz-q-type ${
                        currentQ.type === "blank" ? "type-blank" : "type-mcq"
                      }`}
                    >
                      {currentQ.type === "blank"
                        ? "✍️ Fill in the Blank"
                        : "🎯 Multiple Choice"}
                    </span>
                    {currentQ.topic && (
                      <span className="quiz-q-topic">
                        Topic: {currentQ.topic}
                      </span>
                    )}
                  </div>

                  <h4 className="quiz-q-text">{currentQ.question}</h4>

                  {/* MCQ OPTIONS */}
                  {currentQ.type === "mcq" && (
                    <div className="quiz-options-grid">
                      {currentQ.options?.map((opt, idx) => {
                        const optionLetters = ["A", "B", "C", "D"];
                        const isSelected = answers[currentQ.id] === opt;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`quiz-option-btn ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() =>
                              handleSelectOption(currentQ.id, opt)
                            }
                          >
                            <span className="opt-letter">
                              {optionLetters[idx] || idx + 1}
                            </span>
                            <span className="opt-text">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* FILL IN THE BLANK INPUT */}
                  {currentQ.type === "blank" && (
                    <div className="quiz-blank-wrapper">
                      <label htmlFor="blank-input">
                        Type the missing word / term:
                      </label>
                      <div className="quiz-blank-input-row">
                        <input
                          id="blank-input"
                          type="text"
                          className="quiz-blank-input"
                          placeholder="Type your answer here..."
                          value={answers[currentQ.id] || ""}
                          onChange={(e) =>
                            handleBlankInput(currentQ.id, e.target.value)
                          }
                          autoFocus
                        />
                        {answers[currentQ.id] && (
                          <button
                            className="quiz-clear-btn"
                            onClick={() => handleBlankInput(currentQ.id, "")}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HINT SECTION */}
                  {currentQ.hint && (
                    <div className="quiz-hint-container">
                      {!showHint ? (
                        <button
                          className="quiz-hint-toggle-btn"
                          onClick={() => setShowHint(true)}
                        >
                          <FaLightbulb /> Need a hint?
                        </button>
                      ) : (
                        <div className="quiz-hint-box">
                          <div className="quiz-hint-header">
                            <FaLightbulb /> <strong>AI Hint:</strong>
                            <button
                              className="hint-hide-btn"
                              onClick={() => setShowHint(false)}
                            >
                              Hide
                            </button>
                          </div>
                          <p>{currentQ.hint}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* NAVIGATION FOOTER */}
              <div className="quiz-nav-footer">
                <button
                  className="quiz-nav-btn prev-btn"
                  disabled={currentIdx === 0}
                  onClick={() => {
                    setShowHint(false);
                    setCurrentIdx((i) => Math.max(0, i - 1));
                  }}
                >
                  <FaChevronLeft /> Previous
                </button>

                {/* STEP DOTS */}
                <div className="quiz-step-dots">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered =
                      answers[q.id] && answers[q.id].trim().length > 0;
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={q.id}
                        className={`quiz-dot ${isCurrent ? "current" : ""} ${
                          isAnswered ? "answered" : ""
                        }`}
                        onClick={() => {
                          setShowHint(false);
                          setCurrentIdx(idx);
                        }}
                        title={`Go to Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {currentIdx < quiz.questions.length - 1 ? (
                  <button
                    className="quiz-nav-btn next-btn"
                    onClick={() => {
                      setShowHint(false);
                      setCurrentIdx((i) =>
                        Math.min(quiz.questions.length - 1, i + 1)
                      );
                    }}
                  >
                    Next <FaChevronRight />
                  </button>
                ) : (
                  <button
                    className="quiz-submit-btn"
                    onClick={handleSubmitQuiz}
                  >
                    Submit Quiz 🚀
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE E: SCORECARD & DETAILED EVALUATION */}
          {!loading && !evaluating && viewMode === "scorecard" && evaluation && (
            <div className="quiz-scorecard-view">
              {/* SCORE BANNER */}
              <div className="quiz-score-banner">
                <div className="score-visual-circle">
                  <span className="score-number">
                    {evaluation.totalScore} / {evaluation.maxScore || 5}
                  </span>
                  <span className="score-percent">
                    {evaluation.percentage}%
                  </span>
                </div>

                <div className="score-details-meta">
                  <div className="score-grade-badge">
                    🏆 {evaluation.grade || "Completed"}
                  </div>
                  <h3 className="score-summary-title">Performance Summary</h3>
                  <p className="score-summary-desc">{evaluation.summary}</p>
                </div>
              </div>

              {/* IMPROVEMENT AREAS & STUDY TIPS */}
              <div className="quiz-insights-grid">
                {evaluation.improvementAreas &&
                  evaluation.improvementAreas.length > 0 && (
                    <div className="insight-card weak-areas">
                      <div className="insight-card-header">
                        <FaChartLine className="insight-icon" />
                        <h4>Targeted Improvement Areas</h4>
                      </div>
                      <ul>
                        {evaluation.improvementAreas.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {evaluation.studyTips && evaluation.studyTips.length > 0 && (
                  <div className="insight-card study-tips">
                    <div className="insight-card-header">
                      <FaLightbulb className="insight-icon" />
                      <h4>Recommended Study Actions</h4>
                    </div>
                    <ul>
                      {evaluation.studyTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* QUESTION BY QUESTION BREAKDOWN */}
              <div className="quiz-breakdown-section">
                <div className="breakdown-header">
                  <h4>Question-by-Question Review</h4>
                  <div className="result-filter-tabs">
                    <button
                      className={`filter-tab ${
                        resultFilter === "all" ? "active" : ""
                      }`}
                      onClick={() => setResultFilter("all")}
                    >
                      All ({evaluation.results?.length || 0})
                    </button>
                    <button
                      className={`filter-tab ${
                        resultFilter === "correct" ? "active" : ""
                      }`}
                      onClick={() => setResultFilter("correct")}
                    >
                      ✅ Correct (
                      {evaluation.results?.filter((r) => r.isCorrect).length ||
                        0}
                      )
                    </button>
                    <button
                      className={`filter-tab ${
                        resultFilter === "incorrect" ? "active" : ""
                      }`}
                      onClick={() => setResultFilter("incorrect")}
                    >
                      ❌ Incorrect (
                      {evaluation.results?.filter((r) => !r.isCorrect).length ||
                        0}
                      )
                    </button>
                  </div>
                </div>

                <div className="breakdown-list">
                  {evaluation.results
                    ?.filter((r) => {
                      if (resultFilter === "correct") return r.isCorrect;
                      if (resultFilter === "incorrect") return !r.isCorrect;
                      return true;
                    })
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className={`breakdown-item ${
                          item.isCorrect ? "item-correct" : "item-incorrect"
                        }`}
                      >
                        <div className="breakdown-item-header">
                          <span className="q-index-pill">
                            Q{item.questionId || idx + 1}
                          </span>
                          <span
                            className={`status-pill ${
                              item.isCorrect ? "correct" : "incorrect"
                            }`}
                          >
                            {item.isCorrect ? (
                              <>
                                <FaCheckCircle /> Correct
                              </>
                            ) : (
                              <>
                                <FaTimesCircle /> Incorrect
                              </>
                            )}
                          </span>
                          {item.topic && (
                            <span className="q-topic-badge">
                              {item.topic}
                            </span>
                          )}
                        </div>

                        <p className="breakdown-question">{item.question}</p>

                        <div className="breakdown-answers-row">
                          <div className="ans-box user-ans">
                            <span className="ans-label">Your Answer:</span>
                            <span
                              className={`ans-val ${
                                item.isCorrect ? "text-green" : "text-red"
                              }`}
                            >
                              {item.userAnswer || "*(Left blank)*"}
                            </span>
                          </div>

                          {!item.isCorrect && (
                            <div className="ans-box correct-ans">
                              <span className="ans-label">Expected Answer:</span>
                              <span className="ans-val text-green">
                                {item.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>

                        {item.explanation && (
                          <div className="breakdown-explanation">
                            <strong>AI Analysis:</strong> {item.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* SCORECARD ACTIONS */}
              <div className="scorecard-actions-bar">
                <button className="quiz-primary-btn" onClick={loadQuiz}>
                  <FaRedo /> Retake New Quiz
                </button>
                <button className="quiz-secondary-btn" onClick={onClose}>
                  Done Reviewing
                </button>
              </div>
            </div>
          )}

          {/* STATE F: HISTORY VIEW */}
          {!loading && !evaluating && viewMode === "history" && (
            <div className="quiz-history-view">
              <h4>📜 Past Quiz Attempts on this Note</h4>
              {history.length === 0 ? (
                <p className="empty-history-text">
                  No previous quiz records found for this note. Take a quiz to
                  record your first score!
                </p>
              ) : (
                <div className="history-list">
                  {history.map((att, i) => (
                    <div key={att._id || i} className="history-item-card">
                      <div className="history-score-badge">
                        {att.score} / {att.maxScore} ({att.percentage}%)
                      </div>
                      <div className="history-meta">
                        <span className="history-grade">
                          Grade: <strong>{att.grade}</strong>
                        </span>
                        <span className="history-date">
                          {new Date(att.createdAt).toLocaleDateString()}{" "}
                          {new Date(att.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {att.improvementAreas && att.improvementAreas.length > 0 && (
                        <div className="history-weak-preview">
                          <strong>Weak areas:</strong>{" "}
                          {att.improvementAreas.join("; ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
