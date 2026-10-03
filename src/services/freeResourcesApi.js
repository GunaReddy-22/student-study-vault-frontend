// ============================================================
// 🌐 FREE ACADEMIC APIS & PUBLIC EDUCATIONAL DATA SERVICES
// ============================================================

/**
 * 1. OPEN LIBRARY TEXTBOOKS & BOOKS API (100% Free, No Key Required)
 */
export async function searchOpenLibraryBooks(query, subject = "", page = 1) {
  try {
    let url = "";
    if (query && query.trim()) {
      url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=18`;
    } else if (subject) {
      url = `https://openlibrary.org/subjects/${encodeURIComponent(subject.toLowerCase().replace(/\s+/g, "_"))}.json?limit=18&offset=${(page - 1) * 18}`;
    } else {
      url = `https://openlibrary.org/subjects/computer_science.json?limit=18`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch from Open Library");
    const data = await res.json();

    if (data.docs) {
      // Search format
      return {
        total: data.numFound || data.docs.length,
        items: data.docs.map((b) => ({
          key: b.key,
          title: b.title,
          authors: b.author_name ? b.author_name.join(", ") : "Unknown Author",
          publishYear: b.first_publish_year || b.publish_year?.[0] || "N/A",
          coverUrl: b.cover_i
            ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
            : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60",
          readUrl: b.key ? `https://openlibrary.org${b.key}` : null,
          subjects: b.subject ? b.subject.slice(0, 4) : [],
          editionCount: b.edition_count || 1,
          hasFulltext: Boolean(b.has_fulltext),
        })),
      };
    } else if (data.works) {
      // Subject format
      return {
        total: data.work_count || data.works.length,
        items: data.works.map((b) => ({
          key: b.key,
          title: b.title,
          authors: b.authors ? b.authors.map((a) => a.name).join(", ") : "Various Authors",
          publishYear: b.first_publish_year || "N/A",
          coverUrl: b.cover_id
            ? `https://covers.openlibrary.org/b/id/${b.cover_id}-M.jpg`
            : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60",
          readUrl: b.key ? `https://openlibrary.org${b.key}` : null,
          subjects: b.subject ? b.subject.slice(0, 4) : [],
          editionCount: b.edition_count || 1,
          hasFulltext: true,
        })),
      };
    }

    return { total: 0, items: [] };
  } catch (err) {
    console.error("Open Library error:", err);
    return { total: 0, items: [] };
  }
}

/**
 * 2. ARXIV STEM RESEARCH PAPERS API (Free Open Access)
 */
export async function searchArXivPapers(query = "computer science", maxResults = 12) {
  try {
    const cleanQuery = query.trim() || "all:artificial intelligence";
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
        cleanQuery
      )}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`
    )}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("ArXiv proxy failed");
    const json = await response.json();
    const rawXml = json.contents;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawXml, "text/xml");
    const entries = Array.from(xmlDoc.getElementsByTagName("entry"));

    return entries.map((entry) => {
      const id = entry.getElementsByTagName("id")[0]?.textContent || "";
      const title = entry.getElementsByTagName("title")[0]?.textContent?.replace(/\s+/g, " ").trim() || "Untitled Research";
      const summary = entry.getElementsByTagName("summary")[0]?.textContent?.replace(/\s+/g, " ").trim() || "No summary available";
      const published = entry.getElementsByTagName("published")[0]?.textContent?.slice(0, 10) || "Recent";
      
      const authorNodes = Array.from(entry.getElementsByTagName("author"));
      const authors = authorNodes
        .map((a) => a.getElementsByTagName("name")[0]?.textContent)
        .filter(Boolean)
        .slice(0, 4)
        .join(", ");

      const links = Array.from(entry.getElementsByTagName("link"));
      const pdfLink = links.find((l) => l.getAttribute("title") === "pdf")?.getAttribute("href") || id.replace("/abs/", "/pdf/");

      const categories = Array.from(entry.getElementsByTagName("category"))
        .map((c) => c.getAttribute("term"))
        .filter(Boolean);

      return {
        id,
        title,
        authors: authors || "Research Team",
        summary,
        published,
        pdfUrl: pdfLink,
        absUrl: id,
        categories: categories.slice(0, 3),
      };
    });
  } catch (err) {
    console.error("ArXiv error:", err);
    // Return curated fallback research papers if proxy is blocked
    return getCuratedSTEMPapers(query);
  }
}

/**
 * 3. FREE DICTIONARY & LEXICON API
 */
export async function lookupDictionaryWord(word) {
  if (!word || !word.trim()) return null;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`);
    if (!res.ok) throw new Error("Word not found");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const phoneticsWithAudio = entry.phonetics?.find((p) => p.audio && p.audio.length > 0);

    const meanings = entry.meanings?.map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: m.definitions?.slice(0, 3).map((d) => ({
        definition: d.definition,
        example: d.example || null,
        synonyms: d.synonyms?.slice(0, 4) || [],
      })),
    }));

    return {
      word: entry.word,
      phonetic: entry.phonetic || phoneticsWithAudio?.text || "",
      audioUrl: phoneticsWithAudio?.audio || null,
      meanings: meanings || [],
      sourceUrl: entry.sourceUrls?.[0] || `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
    };
  } catch (err) {
    console.error("Dictionary lookup error:", err);
    return null;
  }
}

/**
 * 4. WIKIMEDIA ACADEMIC TOPIC SUMMARY API
 */
export async function getWikiAcademicSummary(topic) {
  if (!topic || !topic.trim()) return null;
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.trim().replace(/\s+/g, "_"))}`);
    if (!res.ok) throw new Error("Topic not found on Wikipedia");
    const data = await res.json();

    return {
      title: data.title,
      description: data.description || "Academic Topic",
      extract: data.extract,
      thumbnail: data.thumbnail?.source || null,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
    };
  } catch (err) {
    console.error("Wiki summary error:", err);
    return null;
  }
}

/**
 * 5. OPEN TRIVIA DATABASE ACADEMIC QUESTION BANK (Free, Open)
 */
export async function fetchOpenTriviaAcademicQuestions(category = "18", difficulty = "", amount = 10) {
  try {
    let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch questions from OpenTDB");
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((q, idx) => {
        const decodedQuestion = decodeHtmlEntities(q.question);
        const correctAnswer = decodeHtmlEntities(q.correct_answer);
        const incorrectAnswers = q.incorrect_answers.map(decodeHtmlEntities);
        const options = shuffleArray([correctAnswer, ...incorrectAnswers]);

        return {
          id: `opentdb_${idx}_${Date.now()}`,
          question: decodedQuestion,
          options,
          correctAnswer,
          category: decodeHtmlEntities(q.category),
          difficulty: q.difficulty,
          explanation: `Correct Answer: "${correctAnswer}". Verified by Open Trivia Academic Knowledge Base.`,
        };
      });
    }

    return [];
  } catch (err) {
    console.error("OpenTDB error:", err);
    return [];
  }
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 6. CURATED CHEATSHEETS & STEM REFERENCE LIBRARY
 */
export const STEM_CHEATSHEETS = [
  {
    id: "cs-big-o",
    category: "Computer Science",
    title: "Big-O Algorithm & Data Structures Complexity",
    icon: "⚡",
    description: "Time & Space complexity reference for Sorting, Searching & Common Data Structures",
    content: [
      { name: "Array (Access / Search / Insert / Delete)", time: "O(1) / O(n) / O(n) / O(n)", space: "O(n)" },
      { name: "Hash Table (Average / Worst)", time: "O(1) avg / O(n) worst", space: "O(n)" },
      { name: "Binary Search Tree (Average / Worst)", time: "O(log n) avg / O(n) worst", space: "O(n)" },
      { name: "Red-Black / AVL Balanced Tree", time: "O(log n) / O(log n) / O(log n)", space: "O(n)" },
      { name: "Quick Sort (Average / Worst)", time: "O(n log n) avg / O(n²) worst", space: "O(log n)" },
      { name: "Merge Sort (Best / Avg / Worst)", time: "O(n log n) always", space: "O(n)" },
      { name: "Heap Sort", time: "O(n log n) always", space: "O(1)" },
      { name: "Binary Search", time: "O(log n)", space: "O(1)" },
    ],
  },
  {
    id: "cs-sql",
    category: "Computer Science",
    title: "Essential SQL & Relational Queries",
    icon: "🗄️",
    description: "Key SQL commands, JOIN types, Indexing, and Aggregations",
    codeSnippets: [
      { label: "INNER JOIN", code: "SELECT u.name, o.amount FROM users u INNER JOIN orders o ON u.id = o.user_id;" },
      { label: "LEFT JOIN", code: "SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.id IS NULL;" },
      { label: "GROUP BY & HAVING", code: "SELECT subject, AVG(score) FROM grades GROUP BY subject HAVING AVG(score) > 75;" },
      { label: "WINDOW FUNCTION", code: "SELECT name, salary, DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rank FROM emp;" },
    ],
  },
  {
    id: "math-calculus",
    category: "Mathematics",
    title: "Calculus Derivatives & Integrals Reference",
    icon: "📐",
    description: "Fundamental differentiation & integration rules",
    formulas: [
      { name: "Power Rule", eq: "d/dx [x^n] = n * x^(n - 1)" },
      { name: "Product Rule", eq: "d/dx [u * v] = u'v + uv'" },
      { name: "Quotient Rule", eq: "d/dx [u / v] = (u'v - uv') / v^2" },
      { name: "Chain Rule", eq: "d/dx [f(g(x))] = f'(g(x)) * g'(x)" },
      { name: "Exponential", eq: "d/dx [e^(kx)] = k * e^(kx)" },
      { name: "Logarithmic", eq: "d/dx [ln(x)] = 1 / x" },
      { name: "Integration by Parts", eq: "∫ u dv = u * v - ∫ v du" },
      { name: "Fundamental Theorem", eq: "∫ [a to b] f(x) dx = F(b) - F(a)" },
    ],
  },
  {
    id: "physics-constants",
    category: "Physics",
    title: "Fundamental Physical Constants & Equations",
    icon: "⚛️",
    description: "Essential physical constants for mechanics, quantum, and thermodynamics",
    formulas: [
      { name: "Speed of Light (c)", eq: "299,792,458 m/s" },
      { name: "Planck's Constant (h)", eq: "6.62607015 × 10⁻³⁴ J·s" },
      { name: "Gravitational Constant (G)", eq: "6.67430 × 10⁻¹¹ m³/(kg·s²)" },
      { name: "Boltzmann Constant (k_B)", eq: "1.380649 × 10⁻²³ J/K" },
      { name: "Elementary Charge (e)", eq: "1.602176634 × 10⁻¹⁹ C" },
      { name: "Newton's 2nd Law", eq: "F = m * a = dp/dt" },
      { name: "Mass-Energy Equivalence", eq: "E = m * c²" },
      { name: "Schrödinger Equation", eq: "iℏ ∂ψ/∂t = Ĥψ" },
    ],
  },
  {
    id: "cs-git",
    category: "Developer Tools",
    title: "Git & Version Control Power Cheatsheet",
    icon: "🌿",
    description: "Branching, rebasing, stashing, and conflict resolution commands",
    codeSnippets: [
      { label: "Create & Switch Branch", code: "git checkout -b feature/topic" },
      { label: "Interactive Rebase", code: "git rebase -i HEAD~3" },
      { label: "Stash with Message", code: "git stash push -m 'wip changes'" },
      { label: "Discard Local Changes", code: "git restore . && git clean -fd" },
      { label: "Undo Last Commit (Keep edits)", code: "git reset --soft HEAD~1" },
    ],
  },
];

function getCuratedSTEMPapers(query) {
  return [
    {
      id: "https://arxiv.org/abs/1706.03762",
      title: "Attention Is All You Need (Transformers Architecture)",
      authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit",
      summary: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism.",
      published: "2017-06-12",
      pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
      absUrl: "https://arxiv.org/abs/1706.03762",
      categories: ["cs.CL", "cs.LG"],
    },
    {
      id: "https://arxiv.org/abs/2005.14165",
      title: "Language Models are Few-Shot Learners (GPT-3)",
      authors: "Tom B. Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah",
      summary: "Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task.",
      published: "2020-05-28",
      pdfUrl: "https://arxiv.org/pdf/2005.14165.pdf",
      absUrl: "https://arxiv.org/abs/2005.14165",
      categories: ["cs.CL", "cs.AI"],
    },
    {
      id: "https://arxiv.org/abs/1512.03385",
      title: "Deep Residual Learning for Image Recognition (ResNet)",
      authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
      summary: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
      published: "2015-12-10",
      pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
      absUrl: "https://arxiv.org/abs/1512.03385",
      categories: ["cs.CV", "cs.LG"],
    },
    {
      id: "https://arxiv.org/abs/1412.6980",
      title: "Adam: A Method for Stochastic Optimization",
      authors: "Diederik P. Kingma, Jimmy Ba",
      summary: "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments.",
      published: "2014-12-22",
      pdfUrl: "https://arxiv.org/pdf/1412.6980.pdf",
      absUrl: "https://arxiv.org/abs/1412.6980",
      categories: ["cs.LG", "math.OC"],
    },
  ];
}
