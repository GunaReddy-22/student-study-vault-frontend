import api from "./api";

/**
 * 📚 Fetch all practice quiz categories & topics
 */
export async function getQuizCategories() {
  const res = await api.get("/quizzes/categories");
  return res.data;
}

/**
 * ⚡ Generate or fetch mock quiz questions
 */
export async function generateQuizQuestions({
  examId,
  examName,
  subject,
  topic,
  difficulty = "Medium",
  count = 5,
}) {
  const res = await api.post("/quizzes/generate", {
    examId,
    examName,
    subject,
    topic,
    difficulty,
    count,
  });
  return res.data;
}

/**
 * 🏆 Submit test attempt and get results
 */
export async function submitQuizAttempt(payload) {
  const res = await api.post("/quizzes/submit", payload);
  return res.data;
}

/**
 * 📈 Get user quiz performance history
 */
export async function getUserQuizHistory() {
  const res = await api.get("/quizzes/history");
  return res.data;
}
