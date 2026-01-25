import api from "./api";

export const toggleLike = (noteId) =>
  api.post(`/notes/${noteId}/like`);

export const fetchComments = (noteId) =>
  api.get(`/notes/${noteId}/comments`);

export const addComment = (noteId, text) =>
  api.post(`/notes/${noteId}/comment`, { text });
