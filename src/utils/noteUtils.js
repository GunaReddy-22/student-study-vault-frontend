/**
 * Utility functions for note content checking and processing
 */

export const isImageContent = (content) => {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.includes("cloudinary.com") ||
    trimmed.includes("/uploads/") ||
    /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(trimmed)
  );
};

export const isHandwrittenNote = (note) => {
  if (!note) return false;
  return isImageContent(note.content);
};
