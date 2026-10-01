// services/ai.js
import api from "./api";

export const summarizeContent = async (content) => {
  const res = await api.post("/ai/summarize", { content });
  return res.data.summary;
};

export const askAI = async (noteId, question, chatHistory = [], content = "") => {
  const res = await api.post("/ai/ask", {
    noteId,
    question,
    chatHistory,
    content,
  });
  return res.data.answer;
};

export const generateQuiz = async (noteId) => {
  const res = await api.post("/ai/quiz/generate", { noteId });
  return res.data.quiz;
};

export const evaluateQuiz = async ({ noteId, questions, userAnswers }) => {
  const res = await api.post("/ai/quiz/evaluate", {
    noteId,
    questions,
    userAnswers,
  });
  return res.data.evaluation;
};

export const getQuizHistory = async (noteId) => {
  const res = await api.get(`/ai/quiz/history/${noteId}`);
  return res.data.history || [];
};
