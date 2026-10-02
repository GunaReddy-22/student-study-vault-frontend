import api from "./api";

/**
 * 📊 CMS API Client for Full Site & Developer Control
 */

// 1. Overview & Analytics Stats
export async function getCmsStats() {
  const res = await api.get("/cms/stats");
  return res.data;
}

// 2. User & Wallet Management
export async function getCmsUsers(query = "") {
  const res = await api.get("/cms/users", { params: { q: query } });
  return res.data.users || [];
}

export async function creditUserWallet(userId, amount, reason) {
  const res = await api.post(`/cms/users/${userId}/wallet/credit`, { amount, reason });
  return res.data;
}

export async function debitUserWallet(userId, amount, reason) {
  const res = await api.post(`/cms/users/${userId}/wallet/debit`, { amount, reason });
  return res.data;
}

export async function toggleUserDeveloperRole(userId) {
  const res = await api.patch(`/cms/users/${userId}/toggle-developer`);
  return res.data;
}

export async function resetUserPassword(userId, newPassword) {
  const res = await api.post(`/cms/users/${userId}/reset-password`, { newPassword });
  return res.data;
}

export async function toggleUserBan(userId) {
  const res = await api.patch(`/cms/users/${userId}/toggle-ban`);
  return res.data;
}

export async function setUserBalance(userId, amount, reason) {
  const res = await api.post(`/cms/users/${userId}/wallet/set-balance`, { amount, reason });
  return res.data;
}

export async function deleteUser(userId) {
  const res = await api.delete(`/cms/users/${userId}`);
  return res.data;
}

// 3. Custom Quiz CMS Management
export async function getCmsQuizzes() {
  const res = await api.get("/cms/quizzes");
  return res.data.quizzes || [];
}

export async function getQuizById(quizId) {
  const res = await api.get(`/cms/quizzes/${quizId}`);
  return res.data.quiz;
}

export async function cloneQuiz(quizId) {
  const res = await api.post(`/cms/quizzes/${quizId}/clone`);
  return res.data;
}

export async function createCmsQuiz(quizPayload) {
  const res = await api.post("/cms/quizzes", quizPayload);
  return res.data;
}

export async function updateCmsQuiz(quizId, quizPayload) {
  const res = await api.put(`/cms/quizzes/${quizId}`, quizPayload);
  return res.data;
}

export async function deleteCmsQuiz(quizId) {
  const res = await api.delete(`/cms/quizzes/${quizId}`);
  return res.data;
}

export async function toggleQuizPublish(quizId) {
  const res = await api.patch(`/cms/quizzes/${quizId}/publish`);
  return res.data;
}

// 4. Notes Moderation
export async function getCmsNotes(filter = {}) {
  const res = await api.get("/cms/notes", { params: filter });
  return res.data.notes || [];
}

export async function deleteCmsNote(noteId) {
  const res = await api.delete(`/cms/notes/${noteId}`);
  return res.data;
}

// 5. Global Transactions
export async function getCmsTransactions() {
  const res = await api.get("/cms/transactions");
  return res.data.transactions || [];
}

// 6. Direct Cloudinary Upload
export async function uploadCmsImage(base64Image, folder = "studyvault_assets") {
  const res = await api.post("/cms/upload", { image: base64Image, folder });
  return res.data;
}

// 7. Withdrawals & Payouts (CMS Admin)
export async function getCmsWithdrawals(status = "ALL") {
  const res = await api.get("/cms/withdrawals", { params: { status } });
  return res.data.withdrawals || [];
}

export async function approveCmsWithdrawal(id, payoutRef, payoutNotes) {
  const res = await api.post(`/cms/withdrawals/${id}/approve`, { payoutRef, payoutNotes });
  return res.data;
}

export async function rejectCmsWithdrawal(id, rejectionReason) {
  const res = await api.post(`/cms/withdrawals/${id}/reject`, { rejectionReason });
  return res.data;
}

// 8. Student Withdrawal API
export async function getMyWithdrawals() {
  const res = await api.get("/wallet/my-withdrawals");
  return res.data.requests || [];
}

export async function submitWithdrawalRequest(payload) {
  const res = await api.post("/wallet/withdraw", payload);
  return res.data;
}
