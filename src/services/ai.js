export const summarizeContent = async (content) => {
  const res = await fetch("https://student-study-vault-backend.onrender.com/api/ai/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error("AI failed");
  }

  const data = await res.json();
  return data.summary;
};


export const askAI = async (
  noteId,
  question,
  chatHistory = []
) => {
  const res = await fetch(
    "https://student-study-vault-backend.onrender.com/api/ai/ask",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        noteId,
        question,
        chatHistory,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.log(err);
    throw new Error("AI failed");
  }

  const data = await res.json();
  return data.answer;
};
