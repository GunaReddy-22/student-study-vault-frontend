export const summarizeContent = async (content) => {
  const res = await fetch("http://localhost:4000/api/ai/summarize", {
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


export const askAI = async (content, question) => {
  const res = await fetch("http://localhost:4000/api/ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, question }),
  });

  if (!res.ok) throw new Error("AI failed");

  const data = await res.json();
  return data.answer;
};