import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  searchOpenLibraryBooks,
  searchArXivPapers,
  lookupDictionaryWord,
  getWikiAcademicSummary,
  fetchOpenTriviaAcademicQuestions,
  STEM_CHEATSHEETS,
} from "../services/freeResourcesApi";
import { COMPETITIVE_EXAMS_DATA } from "../services/competitiveExamsData";
import { getPublicStudyResources } from "../services/cmsApi";
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
  FiStar,
  FiBookmark,
  FiGrid,
  FiList,
  FiClock,
  FiEye,
  FiX,
  FiTrendingUp,
  FiZap,
  FiCompass,
  FiCheckSquare,
  FiSquare,
  FiMap,
  FiVideo,
  FiBookOpen,
  FiFilter,
  FiPlay,
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
  const [activeTab, setActiveTab] = useState("roadmaps"); // 'roadmaps' | 'books' | 'papers' | 'dictionary' | 'cheatsheets' | 'quizbank' | 'bookmarks'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // --- Competitive Exam Roadmaps State ---
  const [selectedExamId, setSelectedExamId] = useState("upsc-cse");
  const [examViewSection, setExamViewSection] = useState("chapters"); // 'chapters' | 'roadmap' | 'syllabus' | 'books'
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem("sv_completed_topics");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

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
  const [streak, setStreak] = useState(0);

  // --- Bookmarks & User Stats ---
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem("study_vault_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [selectedResourceModal, setSelectedResourceModal] = useState(null);
  const [actionNotice, setActionNotice] = useState("");
  const [cmsResources, setCmsResources] = useState([]);
  const [loadingCmsResources, setLoadingCmsResources] = useState(false);

  // Fetch live CMS curated free resources
  useEffect(() => {
    async function loadCmsResources() {
      try {
        setLoadingCmsResources(true);
        const data = await getPublicStudyResources();
        setCmsResources(data || []);
      } catch (err) {
        console.error("Failed to load CMS free study resources:", err);
      } finally {
        setLoadingCmsResources(false);
      }
    }
    loadCmsResources();
  }, []);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("study_vault_bookmarks", JSON.stringify(bookmarks));
    } catch (_) {}
  }, [bookmarks]);

  // Sync completed syllabus topics to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sv_completed_topics", JSON.stringify(completedTopics));
    } catch (_) {}
  }, [completedTopics]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.8 },
        colors: ["#6366f1", "#10b981", "#38bdf8", "#f59e0b"],
        disableForReducedMotion: true,
      });
    } catch (_) {}
  };

  const toggleTopicCompleted = (topicKey) => {
    setCompletedTopics((prev) => {
      const isFinishing = !prev.includes(topicKey);
      if (isFinishing) {
        triggerCelebration();
      }
      return isFinishing ? [...prev, topicKey] : prev.filter((t) => t !== topicKey);
    });
  };

  const activeExam = useMemo(() => {
    const base = COMPETITIVE_EXAMS_DATA.find((e) => e.id === selectedExamId) || COMPETITIVE_EXAMS_DATA[0];
    const examCopy = JSON.parse(JSON.stringify(base));

    // Filter relevant CMS resources for this exam
    const relevantCms = cmsResources.filter(
      (r) => r.examId === selectedExamId || r.examId === "all"
    );

    if (relevantCms.length > 0) {
      examCopy.chapterGuides = examCopy.chapterGuides || [];
      relevantCms.forEach((r) => {
        const subName = r.subject || "Special Curated Modules";
        let subGuide = examCopy.chapterGuides.find(
          (g) => g.subjectName.toLowerCase() === subName.toLowerCase()
        );
        if (!subGuide) {
          subGuide = {
            subjectId: subName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            subjectName: subName,
            icon: r.subjectIcon || "📚",
            weightage: "⭐ Vault CMS Verified",
            freeVideoLectures: r.freeVideoUrl
              ? [{ title: `${r.chapterTitle || r.title} Masterclass`, channel: r.freeVideoChannel || "Open Masterclass", url: r.freeVideoUrl, duration: "Masterclass" }]
              : [],
            chapters: [],
          };
          examCopy.chapterGuides.push(subGuide);
        }

        const newChapter = {
          chapterNo: r.chapterNo || subGuide.chapters.length + 1,
          title: r.chapterTitle || r.title,
          importance: r.importance || "⭐ Curated Resource",
          whatToStudy: r.whatToStudy || "",
          keyTopics: Array.isArray(r.keyConcepts) ? r.keyConcepts : [],
          freeVideoUrl: r.freeVideoUrl || "",
          freeVideoChannel: r.freeVideoChannel || "",
          freeReadingUrl: r.freeBookUrl || r.officialPortalUrl || "",
          freeBookName: r.freeBookName || "",
          freeBookType: r.freeBookType || "",
          pyqFocus: r.pyqFocus || "",
          isCmsResource: true,
          cmsId: r._id,
        };

        const exists = subGuide.chapters.some((c) => c.title.toLowerCase() === newChapter.title.toLowerCase());
        if (!exists) {
          subGuide.chapters.push(newChapter);
        }
      });
    }

    return examCopy;
  }, [selectedExamId, cmsResources]);

  const examProgressStats = useMemo(() => {
    let totalTopics = 0;
    let completedCount = 0;
    if (activeExam.syllabus) {
      activeExam.syllabus.forEach((sub, sIdx) => {
        sub.topics.forEach((top, tIdx) => {
          totalTopics++;
          const key = `${activeExam.id}_${sIdx}_${tIdx}`;
          if (completedTopics.includes(key)) completedCount++;
        });
      });
    }
    if (activeExam.chapterGuides) {
      activeExam.chapterGuides.forEach((g) => {
        g.chapters.forEach((ch) => {
          totalTopics++;
          const chKey = `ch_${activeExam.id}_${g.subjectId}_${ch.chapterNo}`;
          if (completedTopics.includes(chKey)) completedCount++;
        });
      });
    }
    const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
    return { totalTopics, completedCount, percentage };
  }, [activeExam, completedTopics]);

  const filteredSubjectGuides = useMemo(() => {
    if (!activeExam || !activeExam.chapterGuides) return [];
    return activeExam.chapterGuides
      .filter((g) => selectedSubjectFilter === "all" || g.subjectId === selectedSubjectFilter)
      .map((g) => {
        if (!chapterSearch.trim()) return g;
        const q = chapterSearch.toLowerCase();
        const matchesSubject = g.subjectName.toLowerCase().includes(q);
        const filteredChapters = g.chapters.filter(
          (ch) =>
            ch.title.toLowerCase().includes(q) ||
            ch.whatToStudy.toLowerCase().includes(q) ||
            ch.keyTopics.some((kt) => kt.toLowerCase().includes(q)) ||
            (ch.pyqFocus && ch.pyqFocus.toLowerCase().includes(q))
        );
        if (matchesSubject) return g;
        return { ...g, chapters: filteredChapters };
      })
      .filter((g) => g.chapters && g.chapters.length > 0);
  }, [activeExam, selectedSubjectFilter, chapterSearch]);

  const toggleBookmark = (item, type) => {
    const itemId = item.id || item.key || item.title;
    const exists = bookmarks.some((b) => b.id === itemId);
    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.id !== itemId));
      setActionNotice("Removed from bookmarks");
    } else {
      setBookmarks((prev) => [
        {
          id: itemId,
          type,
          title: item.title,
          authors: item.authors,
          url: item.readUrl || item.pdfUrl || item.pageUrl,
          subject: item.subjects?.[0] || item.category || "Academic Resource",
          summary: item.summary || item.extract || "",
          coverUrl: item.coverUrl,
          savedAt: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
      setActionNotice(`⭐ Saved "${item.title.slice(0, 25)}..." to bookmarks!`);
    }
    setTimeout(() => setActionNotice(""), 3000);
  };

  const isBookmarked = (id) => bookmarks.some((b) => b.id === id);

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

  // Export full competitive exam roadmap to notes
  const exportExamRoadmapToNotes = async (exam) => {
    let markdown = `# 🏛️ ${exam.name} — Master Study Plan\n\n`;
    markdown += `> **Eligibility:** ${exam.eligibility}\n> **Pattern & Total Marks:** ${exam.totalMarks}\n\n`;
    markdown += `## 🗺️ Preparation Strategy & Phase Timeline:\n\n`;
    exam.phases.forEach((p) => {
      markdown += `### 📌 ${p.phaseName}\n**Focus:** ${p.focus}\n`;
      p.milestones.forEach((m) => {
        markdown += `- [ ] ${m}\n`;
      });
      markdown += `\n`;
    });
    if (exam.chapterGuides) {
      markdown += `## 📖 Chapter-Wise Study Guides & Free Video Courses:\n\n`;
      exam.chapterGuides.forEach((g) => {
        markdown += `### 🔹 ${g.subjectName} (${g.weightage})\n`;
        markdown += `**Official Free Textbooks & Portals:**\n`;
        g.freeOfficialBooks?.forEach((b) => {
          markdown += `- [${b.name}](${b.url}) — *${b.type}*\n`;
        });
        markdown += `\n**Chapter Breakdown:**\n`;
        g.chapters.forEach((ch) => {
          markdown += `- **Ch ${ch.chapterNo}: ${ch.title}** [${ch.importance}]\n`;
          markdown += `  - *Where to study:* ${ch.whatToStudy}\n`;
          markdown += `  - *Free Lecture:* [Watch Video Lesson](${ch.freeVideoUrl})\n`;
        });
        markdown += `\n`;
      });
    }
    markdown += `## 📚 Recommended Standard Literature:\n\n`;
    exam.recommendedBooks.forEach((b) => {
      markdown += `- **${b.subject}:** [${b.book}](${b.freeLink})\n`;
    });
    markdown += `\n## 📋 Complete Syllabus Blueprint:\n\n`;
    exam.syllabus.forEach((s) => {
      markdown += `### 🔹 ${s.subject} (${s.weight})\n`;
      s.topics.forEach((t) => {
        markdown += `- [ ] ${t}\n`;
      });
      markdown += `\n`;
    });

    await saveResourceAsNote(
      `${exam.shortName} Master Study Blueprint`,
      "Competitive Exam",
      markdown
    );
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
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
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
      {/* 🌟 HERO & COMPREHENSIVE STUDY METRICS BAR */}
      <div className="resources-hero">
        <div className="resources-hero-text">
          <div className="resources-badge-row">
            <span className="hub-badge free-glow">🌐 100% Free Open Educational Hub</span>
            <span className="hub-badge api-pill">⚡ UPSC • SSC • Groups • ArXiv</span>
            <span className="hub-badge verified-pill">🛡️ Standard Syllabus & Booklists</span>
          </div>
          <h1 className="resources-title">Academic & Competitive Exam Hub</h1>
          <p className="resources-subtitle">
            Complete roadmaps and syllabus trackers for UPSC CSE, SSC CGL/CHSL, State PSC Groups, Banking, along with free textbooks and STEM research papers.
          </p>
        </div>

        {/* 📊 LIVE METRICS DASHBOARD */}
        <div className="hub-metrics-grid">
          <div className="metric-stat-card">
            <div className="metric-icon-box purple">
              <FiCompass />
            </div>
            <div className="metric-content">
              <span className="metric-num">UPSC • SSC</span>
              <span className="metric-label">National Roadmaps</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-box blue">
              <FiBook />
            </div>
            <div className="metric-content">
              <span className="metric-num">10M+</span>
              <span className="metric-label">Open Textbooks</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-box green">
              <FiAward />
            </div>
            <div className="metric-content">
              <span className="metric-num">4,200+</span>
              <span className="metric-label">Practice MCQs</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-icon-box amber">
              <FiBookmark />
            </div>
            <div className="metric-content">
              <span className="metric-num">{bookmarks.length}</span>
              <span className="metric-label">Saved Bookmarks</span>
            </div>
          </div>
        </div>

        {actionNotice && (
          <div className="action-toast-banner">
            {actionNotice}
          </div>
        )}
      </div>

      {/* 🧭 NAVIGATION TABS & CONTROLS */}
      <div className="tabs-header-wrapper">
        <div className="resources-tabs-nav">
          <button
            className={`tab-btn ${activeTab === "roadmaps" ? "active" : ""}`}
            onClick={() => setActiveTab("roadmaps")}
          >
            <FiCompass /> <span>Exam Roadmaps & Syllabus</span>
          </button>
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
            <FiGlobe /> <span>Topic & Lexicon</span>
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
          <button
            className={`tab-btn ${activeTab === "bookmarks" ? "active" : ""}`}
            onClick={() => setActiveTab("bookmarks")}
          >
            <FiStar /> <span>My Bookmarks ({bookmarks.length})</span>
          </button>
        </div>

        {(activeTab === "books" || activeTab === "papers") && (
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FiList />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 🏛️ TAB 0: COMPETITIVE EXAM ROADMAPS & SYLLABUS TRACKER */}
      {/* ========================================================= */}
      {activeTab === "roadmaps" && (
        <section className="tab-pane exam-roadmaps-pane">
          {/* Exam Selector Pills */}
          <div className="exam-selector-cards-row">
            {COMPETITIVE_EXAMS_DATA.map((exam) => (
              <div
                key={exam.id}
                className={`exam-select-card ${selectedExamId === exam.id ? "active" : ""}`}
                onClick={() => setSelectedExamId(exam.id)}
              >
                <span className="exam-card-icon">{exam.icon}</span>
                <div className="exam-card-meta">
                  <h4>{exam.shortName}</h4>
                  <span className="exam-tag-small">{exam.badge}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Exam Overview Banner */}
          <div className="active-exam-hero-card">
            <div className="exam-hero-header">
              <div>
                <span className="exam-badge-pill">{activeExam.badge}</span>
                <h2 className="exam-full-name">{activeExam.name}</h2>
                <p className="exam-tagline">{activeExam.tagline}</p>
                <div className="exam-meta-pills">
                  <span>🎓 {activeExam.eligibility}</span>
                  <span>🏆 {activeExam.totalMarks}</span>
                </div>
              </div>

              <button
                className="btn-export-blueprint"
                onClick={() => exportExamRoadmapToNotes(activeExam)}
                title="Save this entire roadmap and syllabus checklist to your vault notes"
              >
                <FiPlusCircle /> Import Roadmap to My Notes
              </button>
            </div>

            {/* Syllabus Progress Meter */}
            <div className="syllabus-progress-container">
              <div className="progress-top-row">
                <span className="progress-title">
                  📊 Personal Syllabus Preparation Progress: <strong>{examProgressStats.completedCount}</strong> of <strong>{examProgressStats.totalTopics}</strong> Topics Mastered
                </span>
                <span className="progress-percentage-pill">{examProgressStats.percentage}% Ready</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar-fill" style={{ width: `${examProgressStats.percentage}%` }} />
              </div>
            </div>

            {/* Sub-Section Switcher (Chapters vs Roadmap vs Syllabus vs Booklist) */}
            <div className="exam-sub-tabs">
              <button
                className={`exam-sub-tab-btn ${examViewSection === "chapters" ? "active" : ""}`}
                onClick={() => setExamViewSection("chapters")}
              >
                <FiBookOpen /> <span>Chapter-Wise Study Guide & Free Videos</span>
              </button>
              <button
                className={`exam-sub-tab-btn ${examViewSection === "roadmap" ? "active" : ""}`}
                onClick={() => setExamViewSection("roadmap")}
              >
                <FiMap /> <span>Phase-Wise Roadmap</span>
              </button>
              <button
                className={`exam-sub-tab-btn ${examViewSection === "syllabus" ? "active" : ""}`}
                onClick={() => setExamViewSection("syllabus")}
              >
                <FiCheckSquare /> <span>Interactive Syllabus Tracker</span>
              </button>
              <button
                className={`exam-sub-tab-btn ${examViewSection === "books" ? "active" : ""}`}
                onClick={() => setExamViewSection("books")}
              >
                <FiBook /> <span>Recommended Standard Books</span>
              </button>
            </div>
          </div>

          {/* SECTION 0: CHAPTER-WISE STUDY GUIDE & FREE VIDEO MASTERCLASS */}
          {examViewSection === "chapters" && (
            <div className="chapter-guides-container">
              {/* Filter Toolbar */}
              <div className="chapter-filter-toolbar">
                <div className="chapter-search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search chapters, concepts, or topics (e.g. Fundamental Rights, Time & Work, Preamble)..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                  />
                  {chapterSearch && (
                    <button className="clear-filter-btn" onClick={() => setChapterSearch("")}>
                      <FiX />
                    </button>
                  )}
                </div>

                <div className="subject-filter-pills">
                  <button
                    className={`sub-filter-pill ${selectedSubjectFilter === "all" ? "active" : ""}`}
                    onClick={() => setSelectedSubjectFilter("all")}
                  >
                    All Subjects ({activeExam.chapterGuides?.length || 0})
                  </button>
                  {activeExam.chapterGuides?.map((guide) => (
                    <button
                      key={guide.subjectId}
                      className={`sub-filter-pill ${selectedSubjectFilter === guide.subjectId ? "active" : ""}`}
                      onClick={() => setSelectedSubjectFilter(guide.subjectId)}
                    >
                      <span>{guide.icon}</span> {guide.subjectName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Guides List */}
              {filteredSubjectGuides.length === 0 ? (
                <div className="empty-filter-notice">
                  <p>🔍 No chapters found matching "{chapterSearch}". Try searching for another topic or reset filter.</p>
                  <button className="btn-reset-filter" onClick={() => { setChapterSearch(""); setSelectedSubjectFilter("all"); }}>
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                <div className="subject-guides-list">
                  {filteredSubjectGuides.map((guide) => (
                    <div key={guide.subjectId} className="subject-module-card">
                      {/* Module Header */}
                      <div className="subject-module-header">
                        <div className="module-title-area">
                          <span className="module-icon-large">{guide.icon}</span>
                          <div>
                            <h3 className="module-name">{guide.subjectName}</h3>
                            <span className="module-weightage-badge">🎯 {guide.weightage}</span>
                          </div>
                        </div>

                        <div className="module-header-actions">
                          {guide.freeVideoLectures?.[0] && (
                            <a
                              href={guide.freeVideoLectures[0].url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-yt-marathon"
                              title={guide.freeVideoLectures[0].description}
                            >
                              <FiVideo /> <span>Free YouTube Marathon</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Official Free Books & Portals Tray */}
                      {guide.freeOfficialBooks && guide.freeOfficialBooks.length > 0 && (
                        <div className="module-free-books-tray">
                          <div className="tray-label">
                            <FiBookOpen /> <span>100% Free Official Books & Portals:</span>
                          </div>
                          <div className="free-books-pills">
                            {guide.freeOfficialBooks.map((book, bIdx) => (
                              <a
                                key={bIdx}
                                href={book.url}
                                target="_blank"
                                rel="noreferrer"
                                className="free-book-chip"
                                title={book.description}
                              >
                                <span className="book-type-tag">{book.type}</span>
                                <span className="book-chip-name">{book.name}</span>
                                <FiExternalLink className="chip-ext" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chapter-by-Chapter Cards Grid */}
                      <div className="chapters-grid">
                        {guide.chapters.map((ch) => {
                          const chKey = `ch_${activeExam.id}_${guide.subjectId}_${ch.chapterNo}`;
                          const isDone = completedTopics.includes(chKey);

                          return (
                            <div key={ch.chapterNo} className={`chapter-card ${isDone ? "chapter-completed" : ""}`}>
                              <div className="chapter-top-bar">
                                <span className="chapter-number-badge">Chapter {ch.chapterNo}</span>
                                <span className={`chapter-importance-tag ${ch.importance.includes("High Yield") ? "high-yield" : ""}`}>
                                  {ch.importance}
                                </span>
                              </div>

                              <h4 className="chapter-title">{ch.title}</h4>

                              {/* Where & What to Study Box */}
                              <div className="study-guidance-box">
                                <div className="guidance-label">
                                  <FiCompass /> <strong>Where & What to Study:</strong>
                                </div>
                                <p className="guidance-text">{ch.whatToStudy}</p>
                              </div>

                              {/* Core Concepts */}
                              <div className="core-concepts-block">
                                <div className="concepts-label">💡 Must-Master Concepts:</div>
                                <ul className="concepts-bullet-list">
                                  {ch.keyTopics.map((kt, ktIdx) => (
                                    <li key={ktIdx}>{kt}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* PYQ Note */}
                              {ch.pyqFocus && (
                                <div className="pyq-focus-note">
                                  <span className="pyq-badge">🎯 PYQ Trend</span>
                                  <p>{ch.pyqFocus}</p>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="chapter-card-actions">
                                <a
                                  href={ch.freeVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-ch-action video-btn"
                                >
                                  <FiVideo /> Free Video Lesson
                                </a>
                                <a
                                  href={ch.freeReadingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-ch-action read-btn"
                                >
                                  <FiBookOpen /> Read Free Book
                                </a>
                                <button
                                  className={`btn-ch-action complete-btn ${isDone ? "active" : ""}`}
                                  onClick={() => toggleTopicCompleted(chKey)}
                                >
                                  {isDone ? <FiCheck /> : <FiSquare />} {isDone ? "Mastered" : "Mark Done"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION A: ROADMAP PHASES */}
          {examViewSection === "roadmap" && (
            <div className="phases-timeline">
              {activeExam.phases.map((phase, pIdx) => (
                <div key={pIdx} className="phase-card">
                  <div className="phase-step-badge">Phase {pIdx + 1}</div>
                  <h3 className="phase-heading">{phase.phaseName}</h3>
                  <div className="phase-focus-tag">🎯 Core Focus: {phase.focus}</div>
                  <ul className="milestone-list">
                    {phase.milestones.map((m, mIdx) => (
                      <li key={mIdx}>
                        <span className="bullet-point">✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* SECTION B: INTERACTIVE SYLLABUS CHECKLIST */}
          {examViewSection === "syllabus" && (
            <div className="syllabus-accordion-container">
              {activeExam.syllabus.map((subjectBlock, sIdx) => (
                <div key={sIdx} className="subject-syllabus-block">
                  <div className="subject-header-row">
                    <h3 className="subject-name">{subjectBlock.subject}</h3>
                    <span className="subject-weightage">{subjectBlock.weight}</span>
                  </div>

                  <div className="topics-checkbox-grid">
                    {subjectBlock.topics.map((topic, tIdx) => {
                      const topicKey = `${activeExam.id}_${sIdx}_${tIdx}`;
                      const isDone = completedTopics.includes(topicKey);

                      return (
                        <div
                          key={tIdx}
                          className={`topic-check-item ${isDone ? "completed" : ""}`}
                          onClick={() => toggleTopicCompleted(topicKey)}
                        >
                          <span className="checkbox-icon">
                            {isDone ? <FiCheckSquare color="#10b981" /> : <FiSquare color="#64748b" />}
                          </span>
                          <span className="topic-text">{topic}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION C: RECOMMENDED STANDARD BOOKS */}
          {examViewSection === "books" && (
            <div className="exam-booklist-grid">
              {activeExam.recommendedBooks.map((item, bIdx) => (
                <div key={bIdx} className="exam-book-card">
                  <div className="book-badge-icon">📖</div>
                  <div className="book-card-content">
                    <span className="book-subject-tag">{item.subject}</span>
                    <h4 className="book-title-text">{item.book}</h4>
                    <div className="book-link-row">
                      <a href={item.freeLink} target="_blank" rel="noreferrer" className="btn-card-action primary">
                        <FiExternalLink /> Search on Open Library
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
                placeholder="Search millions of free books by title, author, or topic (e.g. Calculus, Operating Systems, Physics)..."
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
            <div className={`books-layout ${viewMode === "list" ? "list-mode" : "grid-mode"}`}>
              {books.map((b, idx) => {
                const bookId = b.key || `book_${idx}`;
                const bookmarked = isBookmarked(bookId);

                return (
                  <div key={bookId} className="book-resource-card">
                    <div className="book-cover-wrap">
                      <img src={b.coverUrl} alt={b.title} loading="lazy" />
                      {b.hasFulltext && <span className="open-access-tag">Free Read</span>}
                      <button
                        className={`btn-star-bookmark ${bookmarked ? "starred" : ""}`}
                        onClick={() => toggleBookmark(b, "book")}
                        title={bookmarked ? "Remove Bookmark" : "Save to Bookmarks"}
                      >
                        <FiStar />
                      </button>
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
                );
              })}
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
                placeholder="Search ArXiv scientific papers (e.g. Transformers, Quantum, Deep Learning, Neural Networks)..."
                value={paperQuery}
                onChange={(e) => setPaperQuery(e.target.value)}
              />
              <button type="submit" className="hub-search-btn">Search ArXiv</button>
            </form>
          </div>

          {loadingPapers ? (
            <div className="hub-loading-state">
              <div className="spinner"></div>
              <p>Fetching scientific preprints from ArXiv...</p>
            </div>
          ) : (
            <div className="papers-list">
              {papers.map((p, idx) => {
                const paperId = p.id || `paper_${idx}`;
                const bookmarked = isBookmarked(paperId);

                return (
                  <div key={paperId} className="paper-item-card">
                    <div className="paper-header">
                      <h3 className="paper-title">{p.title}</h3>
                      <div className="paper-top-right">
                        <div className="paper-tags">
                          {p.categories?.map((cat) => (
                            <span key={cat} className="paper-tag-pill">{cat}</span>
                          ))}
                        </div>
                        <button
                          className={`btn-star-bookmark inline ${bookmarked ? "starred" : ""}`}
                          onClick={() => toggleBookmark(p, "paper")}
                          title={bookmarked ? "Remove Bookmark" : "Save to Bookmarks"}
                        >
                          <FiStar />
                        </button>
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
                      <button
                        className="btn-card-action ghost"
                        onClick={() => setSelectedResourceModal(p)}
                      >
                        <FiEye /> Quick Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
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
                placeholder="Look up any scientific concept, term, or word (e.g. Thermodynamics, Heuristic, Mitochondria)..."
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
              <div className="results-badge-row">
                <span className="res-pill">🎯 Accuracy: {Math.round((score / questions.length) * 100)}%</span>
                <span className="res-pill">🔥 Max Streak: {streak}</span>
              </div>
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
                <div className="quiz-header-pills">
                  {streak > 1 && <span className="streak-badge">🔥 {streak} Streak</span>}
                  <span className={`diff-pill ${questions[currentQIndex]?.difficulty}`}>
                    {questions[currentQIndex]?.difficulty}
                  </span>
                </div>
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

      {/* ========================================================= */}
      {/* ⭐ TAB 6: MY BOOKMARKS */}
      {/* ========================================================= */}
      {activeTab === "bookmarks" && (
        <section className="tab-pane">
          {bookmarks.length === 0 ? (
            <div className="empty-bookmarks-state">
              <span className="empty-star">⭐</span>
              <h3>No Saved Bookmarks Yet</h3>
              <p>Click the star icon on any textbook, scientific paper, or academic topic to save it here for fast revision.</p>
            </div>
          ) : (
            <div className="bookmarks-grid">
              {bookmarks.map((b) => (
                <div key={b.id} className="bookmark-card">
                  <div className="bm-header">
                    <span className="bm-type-badge">{b.type === "book" ? "📖 Book" : "🔬 Research Paper"}</span>
                    <button className="btn-remove-bm" onClick={() => toggleBookmark(b, b.type)} title="Remove Bookmark">
                      <FiX />
                    </button>
                  </div>
                  <h3 className="bm-title">{b.title}</h3>
                  {b.authors && <p className="bm-author">By {b.authors}</p>}
                  {b.summary && <p className="bm-summary">{b.summary.slice(0, 180)}...</p>}
                  <div className="bm-footer">
                    <span className="bm-date">Saved on {b.savedAt}</span>
                    {b.url && (
                      <a href={b.url} target="_blank" rel="noreferrer" className="btn-card-action primary">
                        <FiExternalLink /> Open Resource
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 🔍 RESOURCE INSPECTION MODAL */}
      {/* ========================================================= */}
      {selectedResourceModal && (
        <div className="resource-modal-overlay" onClick={() => setSelectedResourceModal(null)}>
          <div className="resource-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <span className="modal-tag">🔬 ArXiv Paper Details</span>
              <button className="modal-close-btn" onClick={() => setSelectedResourceModal(null)}>
                <FiX />
              </button>
            </div>
            <h2 className="modal-resource-title">{selectedResourceModal.title}</h2>
            <p className="modal-authors">✍️ {selectedResourceModal.authors}</p>
            <div className="modal-abstract-box">
              <h4>Abstract Summary:</h4>
              <p>{selectedResourceModal.summary}</p>
            </div>
            <div className="modal-actions">
              <a
                href={selectedResourceModal.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-card-action primary"
              >
                <FiExternalLink /> View PDF
              </a>
              <button
                className="btn-card-action secondary"
                onClick={() => {
                  saveResourceAsNote(
                    selectedResourceModal.title,
                    "Research Paper",
                    `## 🔬 Research Paper: ${selectedResourceModal.title}\n**Authors:** ${selectedResourceModal.authors}\n**Abstract:** ${selectedResourceModal.summary}\n`
                  );
                  setSelectedResourceModal(null);
                }}
              >
                <FiPlusCircle /> Save to Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
