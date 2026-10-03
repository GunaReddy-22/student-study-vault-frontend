import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchOpenLibraryBooks,
  searchArXivPapers,
  lookupDictionaryWord,
  getWikiAcademicSummary,
  fetchOpenTriviaAcademicQuestions,
  STEM_CHEATSHEETS,
} from "../services/freeResourcesApi";
import api from "../services/api";
import "./FreeResourcesHub.css";
import {
  FiBook,
  FiFileText,
  FiSearch,
  FiGlobe,
  FiAward,
  FiExternalLink,
  FiPlusCircle,
  FiVolume2,
  FiCopy,
  FiCheck,
  FiLayers,
  FiRefreshCw,
  FiCode,
  FiCpu,
} from "react-icons/fi";

const SUBJECT_CATEGORIES = [
  "Computer Science",
  "Artificial Intelligence",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Psychology",
  "Engineering",
  "World History",
];

const OPENTDB_CATEGORIES = [
  { id: "18", name: "💻 Science: Computers" },
  { id: "19", name: "📐 Science: Mathematics" },
  { id: "17", name: "🔬 Science & Nature" },
  { id: "23", name: "🏛️ History" },
  { id: "22", name: "🌍 Geography" },
  { id: "9", name: "🧠 General Knowledge" },
];

export default function FreeResourcesHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("books"); // 'books' | 'papers' | 'dictionary' | 'cheatsheets' | 'quizbank'

  // --- Books State ---
  const [bookQuery, setBookQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Computer Science");
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // --- ArXiv Papers State ---
  const [paperQuery, setPaperQuery] = useState("artificial intelligence");
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // --- Dictionary & Topic State ---
  const [lookupQuery, setLookupQuery] = useState("Photosynthesis");
  const [dictResult, setDictResult] = useState(null);
  const [wikiResult, setWikiResult] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // --- Cheatsheets State ---
  const [cheatsheetSearch, setCheatsheetSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // --- Question Bank State ---
  const [quizCategory, setQuizCategory] = useState("18");
  const [quizDifficulty, setQuizDifficulty] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Toast / Note Creation feedback
  const [actionNotice, setActionNotice] = useState("");

  // Fetch initial books
  useEffect(() => {
    fetchBooks(bookQuery, selectedSubject);
  }, [selectedSubject]);

  const fetchBooks = async (query, subject) => {
    setLoadingBooks(true);
    try {
      const res = await searchOpenLibraryBooks(query, subject, 1);
      setBooks(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleBookSearch = (e) => {
    e.preventDefault();
    fetchBooks(bookQuery, "");
  };

  // Fetch ArXiv papers
  useEffect(() => {
    fetchPapers(paperQuery);
  }, []);

  const fetchPapers = async (q) => {
    setLoadingPapers(true);
    try {
      const results = await searchArXivPapers(q);
      setPapers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handlePaperSearch = (e) => {
    e.preventDefault();
    fetchPapers(paperQuery);
  };

  // Fetch Dictionary & Wikipedia Summary
  const executeLookup = async (term) => {
    if (!term || !term.trim()) return;
    setLoadingLookup(true);
    try {
      const [dict, wiki] = await Promise.all([
        lookupDictionaryWord(term),
        getWikiAcademicSummary(term),
      ]);
      setDictResult(dict);
      setWikiResult(wiki);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLookup(false);
    }
  };

  useEffect(() => {
    executeLookup("Photosynthesis");
  }, []);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    executeLookup(lookupQuery);
  };

  // Audio Pronunciation
  const playAudio = (url, word) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => speakWord(word));
    } else {
      speakWord(word);
    }
  };

  const speakWord = (word) => {
    if ("speechSynthesis" in window && word) {
      const utter = new SpeechSynthesisUtterance(word);
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  // Copy Code Snippet
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick-save resource as a note in StudyVault
  const saveResourceAsNote = async (title, subject, content) => {
    try {
      await api.post("/notes", {
        title: title.slice(0, 80),
        subject: subject || "General Study",
        content: content,
        isPublic: false,
      });
      setActionNotice(`✅ Added "${title.slice(0, 25)}..." to your Study Vault Notes!`);
      setTimeout(() => setActionNotice(""), 3500);
    } catch (_) {
      setActionNotice("⚠️ Please login to save notes directly to your vault.");
      setTimeout(() => setActionNotice(""), 3500);
    }
  };

  // Fetch OpenTDB Quiz questions
  const loadQuizQuestions = async () => {
    setLoadingQuiz(true);
    setQuizFinished(false);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    try {
      const qs = await fetchOpenTriviaAcademicQuestions(quizCategory, quizDifficulty, 10);
      setQuestions(qs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quizbank" && questions.length === 0) {
      loadQuizQuestions();
    }
  }, [activeTab]);

  const handleQuizAnswer = (ans) => {
    if (selectedAnswer) return;
    setSelectedAnswer(ans);
    if (ans === questions[currentQIndex].correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  // Filtered cheatsheets
  const filteredCheatsheets = useMemo(() => {
    return STEM_CHEATSHEETS.filter((c) => {
      const matchCat = activeCategory === "all" || c.category.toLowerCase().includes(activeCategory.toLowerCase());
      const matchSearch =
        !cheatsheetSearch ||
        c.title.toLowerCase().includes(cheatsheetSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(cheatsheetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [cheatsheetSearch, activeCategory]);

  return (
    <div className="resources-hub-container">
      {/* 🚀 HERO HEADER */}
      <div className="resources-hero">
        <div className="resources-hero-text">
          <div className="resources-badge-row">
            <span className="hub-badge free-glow">🌐 100% Free Open Educational Hub</span>
            <span className="hub-badge api-pill">⚡ Open Library • ArXiv • OpenTDB</span>
          </div>
          <h1 className="resources-title">Academic Discovery & Free Resources</h1>
          <p className="resources-subtitle">
            Search millions of free textbooks, research papers, STEM formulas, academic definitions, and practice question banks.
          </p>
        </div>

        {actionNotice && (
          <div className="action-toast-banner">
            {actionNotice}
          </div>
        )}
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="resources-tabs-nav">
        <button
          className={`tab-btn ${activeTab === "books" ? "active" : ""}`}
          onClick={() => setActiveTab("books")}
        >
          <FiBook /> <span>Free Textbooks</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "papers" ? "active" : ""}`}
          onClick={() => setActiveTab("papers")}
        >
          <FiFileText /> <span>ArXiv STEM Papers</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "dictionary" ? "active" : ""}`}
          onClick={() => setActiveTab("dictionary")}
        >
          <FiGlobe /> <span>Topic & Lexicon Lookup</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "cheatsheets" ? "active" : ""}`}
          onClick={() => setActiveTab("cheatsheets")}
        >
          <FiCode /> <span>STEM Cheat Sheets</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "quizbank" ? "active" : ""}`}
          onClick={() => setActiveTab("quizbank")}
        >
          <FiAward /> <span>Open Question Bank</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 📚 TAB 1: OPEN LIBRARY TEXTBOOKS & BOOKS */}
      {/* ========================================================= */}
      {activeTab === "books" && (
        <section className="tab-pane">
          <div className="tab-controls-row">
            <form onSubmit={handleBookSearch} className="hub-search-form">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search millions of free books by title, author, or topic..."
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
              />
              <button type="submit" className="hub-search-btn">Search Books</button>
            </form>
          </div>

          {/* Subject Pills */}
          <div className="subject-pills-scroll">
            {SUBJECT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`subject-pill ${selectedSubject === cat && !bookQuery ? "active" : ""}`}
                onClick={() => {
                  setBookQuery("");
                  setSelectedSubject(cat);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingBooks ? (
            <div className="hub-loading-state">
              <div className="spinner"></div>
              <p>Searching Open Library global repository...</p>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((b, idx) => (
                <div key={b.key || idx} className="book-resource-card">
                  <div className="book-cover-wrap">
                    <img src={b.coverUrl} alt={b.title} loading="lazy" />
                    {b.hasFulltext && <span className="open-access-tag">Free Read</span>}
                  </div>
                  <div className="book-info-wrap">
                    <h3 className="book-title" title={b.title}>{b.title}</h3>
                    <p className="book-author">By {b.authors}</p>
                    <div className="book-meta-row">
                      <span>📅 {b.publishYear}</span>
                      <span>📖 {b.editionCount} {b.editionCount === 1 ? "Edition" : "Editions"}</span>
                    </div>

                    <div className="book-actions-row">
                      {b.readUrl && (
                        <a
                          href={b.readUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-card-action primary"
                        >
                          <FiExternalLink /> Read Book
                        </a>
                      )}
                      <button
                        className="btn-card-action secondary"
                        onClick={() =>
                          saveResourceAsNote(
                            b.title,
                            selectedSubject || "Reference Book",
                            `## 📖 Book Reference: ${b.title}\n**Author:** ${b.authors}\n**Published:** ${b.publishYear}\n**Open Library Link:** [Read on Open Library](${b.readUrl})\n\n### 📝 Notes & Chapter Summaries:\n- Key Takeaway 1:\n- Key Takeaway 2:\n`
                          )
                        }
                        title="Add to My Study Vault Notes"
                      >
                        <FiPlusCircle /> Save to Notes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 🔬 TAB 2: ARXIV STEM RESEARCH PAPERS */}
      {/* ========================================================= */}
      {activeTab === "papers" && (
        <section className="tab-pane">
          <div className="tab-controls-row">
            <form onSubmit={handlePaperSearch} className="hub-search-form">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search ArXiv scientific papers (e.g. Transformers, Quantum, Deep Learning)..."
                value={paperQuery}
                onChange={(e) => setPaperQuery(e.target.value)}
              />
              <button type="submit" className="hub-search-btn">Search ArXiv</button>
            </form>
          </div>

          {loadingPapers ? (
            <div className="hub-loading-state">
              <div className="spinner"></div>
              <p>Fetching scientific papers from ArXiv...</p>
            </div>
          ) : (
            <div className="papers-list">
              {papers.map((p, idx) => (
                <div key={p.id || idx} className="paper-item-card">
                  <div className="paper-header">
                    <h3 className="paper-title">{p.title}</h3>
                    <div className="paper-tags">
                      {p.categories?.map((cat) => (
                        <span key={cat} className="paper-tag-pill">{cat}</span>
                      ))}
                    </div>
                  </div>

                  <p className="paper-authors">✍️ {p.authors} • 📅 Published {p.published}</p>
                  <p className="paper-abstract">{p.summary}</p>

                  <div className="paper-footer-actions">
                    <a
                      href={p.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-card-action primary"
                    >
                      <FiExternalLink /> Open PDF Fullpaper
                    </a>
                    <button
                      className="btn-card-action secondary"
                      onClick={() =>
                        saveResourceAsNote(
                          p.title,
                          "Research Paper",
                          `## 🔬 Research Paper: ${p.title}\n**Authors:** ${p.authors}\n**Published:** ${p.published}\n**PDF Link:** [Download ArXiv PDF](${p.pdfUrl})\n\n### 📌 Abstract Summary:\n${p.summary}\n\n### 💡 Key Findings & Study Notes:\n1. Problem Addressed:\n2. Methodology:\n3. Results:\n`
                        )
                      }
                    >
                      <FiPlusCircle /> Save to Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 🧠 TAB 3: TOPIC & LEXICON LOOKUP (WIKI + DICTIONARY) */}
      {/* ========================================================= */}
      {activeTab === "dictionary" && (
        <section className="tab-pane">
          <div className="tab-controls-row">
            <form onSubmit={handleLookupSubmit} className="hub-search-form">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Look up any scientific concept, term, or word..."
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
              />
              <button type="submit" className="hub-search-btn">Instant Lookup</button>
            </form>
          </div>

          {loadingLookup ? (
            <div className="hub-loading-state">
              <div className="spinner"></div>
              <p>Searching Academic Lexicon & Wikipedia summary...</p>
            </div>
          ) : (
            <div className="lookup-grid-layout">
              {/* Wikipedia Topic Card */}
              {wikiResult && (
                <div className="lookup-card wiki-card">
                  <div className="lookup-card-header">
                    <span className="card-source-tag">📚 Wikipedia Academic Topic</span>
                    <a href={wikiResult.pageUrl} target="_blank" rel="noreferrer" className="link-ext">
                      Full Article <FiExternalLink />
                    </a>
                  </div>
                  <div className="wiki-content-wrap">
                    {wikiResult.thumbnail && (
                      <img src={wikiResult.thumbnail} alt={wikiResult.title} className="wiki-thumb" />
                    )}
                    <div>
                      <h2 className="lookup-word-title">{wikiResult.title}</h2>
                      <p className="wiki-desc">{wikiResult.description}</p>
                    </div>
                  </div>
                  <p className="wiki-extract-text">{wikiResult.extract}</p>
                  <button
                    className="btn-card-action secondary mt-auto"
                    onClick={() =>
                      saveResourceAsNote(
                        wikiResult.title,
                        "Concept Study",
                        `## 🧠 Academic Concept: ${wikiResult.title}\n*${wikiResult.description}*\n\n${wikiResult.extract}\n\n**Source:** [Read Full on Wikipedia](${wikiResult.pageUrl})\n`
                      )
                    }
                  >
                    <FiPlusCircle /> Save Concept to Notes
                  </button>
                </div>
              )}

              {/* Dictionary Lexicon Card */}
              {dictResult ? (
                <div className="lookup-card dict-card">
                  <div className="lookup-card-header">
                    <span className="card-source-tag">📖 Oxford/Wiktionary Lexicon</span>
                    <button
                      className="btn-audio-listen"
                      onClick={() => playAudio(dictResult.audioUrl, dictResult.word)}
                      title="Listen to Pronunciation"
                    >
                      <FiVolume2 /> Pronounce
                    </button>
                  </div>

                  <div className="dict-word-row">
                    <h2 className="lookup-word-title">{dictResult.word}</h2>
                    {dictResult.phonetic && <span className="phonetic-badge">{dictResult.phonetic}</span>}
                  </div>

                  <div className="meanings-container">
                    {dictResult.meanings.map((m, mIdx) => (
                      <div key={mIdx} className="meaning-block">
                        <span className="pos-pill">{m.partOfSpeech}</span>
                        <ul className="definition-list">
                          {m.definitions.map((d, dIdx) => (
                            <li key={dIdx}>
                              <p className="def-text">{d.definition}</p>
                              {d.example && <p className="def-example">"{d.example}"</p>}
                              {d.synonyms.length > 0 && (
                                <div className="synonyms-row">
                                  <span>Synonyms:</span>
                                  {d.synonyms.map((s) => (
                                    <span
                                      key={s}
                                      className="syn-tag"
                                      onClick={() => {
                                        setLookupQuery(s);
                                        executeLookup(s);
                                      }}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="lookup-card dict-card empty-state">
                  <p>💡 No exact dictionary entry found, but topic overview is displayed above.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* ⚡ TAB 4: STEM & CS CHEAT SHEETS */}
      {/* ========================================================= */}
      {activeTab === "cheatsheets" && (
        <section className="tab-pane">
          <div className="tab-controls-row">
            <div className="hub-search-form">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search formulas, Big-O tables, SQL queries, or constants..."
                value={cheatsheetSearch}
                onChange={(e) => setCheatsheetSearch(e.target.value)}
              />
            </div>

            <div className="filter-button-group">
              {["all", "Computer Science", "Mathematics", "Physics", "Developer Tools"].map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="cheatsheets-grid">
            {filteredCheatsheets.map((sheet) => (
              <div key={sheet.id} className="cheatsheet-card">
                <div className="sheet-header">
                  <span className="sheet-icon">{sheet.icon}</span>
                  <div>
                    <h3 className="sheet-title">{sheet.title}</h3>
                    <span className="sheet-category-badge">{sheet.category}</span>
                  </div>
                </div>
                <p className="sheet-desc">{sheet.description}</p>

                {/* Big-O Content */}
                {sheet.content && (
                  <div className="table-responsive">
                    <table className="complexity-table">
                      <thead>
                        <tr>
                          <th>Operation / Structure</th>
                          <th>Time Complexity</th>
                          <th>Space</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.content.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td>{row.name}</td>
                            <td className="time-col">{row.time}</td>
                            <td>{row.space}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Code Snippets */}
                {sheet.codeSnippets && (
                  <div className="snippets-list">
                    {sheet.codeSnippets.map((snip, sIdx) => (
                      <div key={sIdx} className="snippet-box">
                        <div className="snippet-top">
                          <span className="snippet-label">{snip.label}</span>
                          <button
                            className="btn-copy-code"
                            onClick={() => copyToClipboard(snip.code, `${sheet.id}_${sIdx}`)}
                            title="Copy to clipboard"
                          >
                            {copiedId === `${sheet.id}_${sIdx}` ? <FiCheck color="#34d399" /> : <FiCopy />}
                          </button>
                        </div>
                        <pre className="code-block">{snip.code}</pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulas List */}
                {sheet.formulas && (
                  <div className="formulas-grid">
                    {sheet.formulas.map((form, fIdx) => (
                      <div key={fIdx} className="formula-item">
                        <span className="form-name">{form.name}</span>
                        <code className="form-eq">{form.eq}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 🏆 TAB 5: OPEN QUESTION BANK (OPENTDB) */}
      {/* ========================================================= */}
      {activeTab === "quizbank" && (
        <section className="tab-pane">
          <div className="quizbank-control-panel">
            <div className="quizbank-select-group">
              <label>Select Subject Category:</label>
              <select
                value={quizCategory}
                onChange={(e) => setQuizCategory(e.target.value)}
                className="hub-select"
              >
                {OPENTDB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="quizbank-select-group">
              <label>Difficulty:</label>
              <select
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value)}
                className="hub-select"
              >
                <option value="">Any Difficulty</option>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>

            <button className="btn-load-quiz" onClick={loadQuizQuestions} disabled={loadingQuiz}>
              <FiRefreshCw className={loadingQuiz ? "spin" : ""} /> Load 10 New Questions
            </button>
          </div>

          {loadingQuiz ? (
            <div className="hub-loading-state">
              <div className="spinner"></div>
              <p>Fetching practice questions from Open Trivia database...</p>
            </div>
          ) : quizFinished ? (
            <div className="quiz-results-card">
              <span className="trophy-emoji">🏆</span>
              <h2>Practice Session Complete!</h2>
              <p className="score-statement">
                You scored <strong>{score}</strong> out of <strong>{questions.length}</strong> questions correctly (
                {Math.round((score / questions.length) * 100)}%)
              </p>
              <button className="btn-load-quiz" onClick={loadQuizQuestions}>
                🔄 Start Another Practice Set
              </button>
            </div>
          ) : questions.length > 0 ? (
            <div className="quiz-question-card">
              <div className="quiz-progress-bar-wrap">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="quiz-q-header">
                <span className="q-number">Question {currentQIndex + 1} of {questions.length}</span>
                <span className={`diff-pill ${questions[currentQIndex]?.difficulty}`}>
                  {questions[currentQIndex]?.difficulty}
                </span>
              </div>

              <h2 className="question-prompt">{questions[currentQIndex]?.question}</h2>

              <div className="options-grid">
                {questions[currentQIndex]?.options.map((opt, oIdx) => {
                  let optClass = "quiz-option-btn";
                  if (selectedAnswer) {
                    if (opt === questions[currentQIndex].correctAnswer) {
                      optClass += " correct";
                    } else if (opt === selectedAnswer) {
                      optClass += " wrong";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      className={optClass}
                      onClick={() => handleQuizAnswer(opt)}
                      disabled={Boolean(selectedAnswer)}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswer && (
                <div className="quiz-explanation-box">
                  <p>{questions[currentQIndex]?.explanation}</p>
                  <button className="btn-next-q" onClick={handleNextQuiz}>
                    {currentQIndex + 1 === questions.length ? "Finish Practice Quiz 🎉" : "Next Question ➡️"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hub-loading-state">
              <p>No questions found for this configuration. Click "Load 10 New Questions" to fetch.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
