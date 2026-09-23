import React from "react";
import "./FormattedAIResponse.css";

export default function FormattedAIResponse({ content }) {
  if (!content) return null;

  // Function to render inline bold, code, italic
  const renderInline = (text) => {
    if (!text) return "";

    // Split by code blocks, bold, etc.
    const parts = [];
    let remaining = text;
    let key = 0;

    // Replace bold **text** and inline `code`
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const splitParts = text.split(regex);

    return splitParts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} className="ai-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={idx} className="ai-inline-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={idx} className="ai-italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Pre-process content into lines and structured blocks
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let currentList = null;

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      return;
    }

    // Heading (e.g. ### Heading or **Heading**)
    if (line.startsWith("### ")) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({
        type: "h3",
        text: line.replace(/^###\s+/, ""),
      });
      return;
    }

    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({
        type: "h2",
        text: line.replace(/^#{1,2}\s+/, ""),
      });
      return;
    }

    // Bullet points (e.g. - item or * item)
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      const itemText = line.replace(/^[-*•]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        if (currentList) blocks.push(currentList);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(itemText);
      return;
    }

    // Numbered list (e.g. 1. item)
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (!currentList || currentList.type !== "ol") {
        if (currentList) blocks.push(currentList);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(itemText);
      return;
    }

    // Regular paragraph
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }

    blocks.push({
      type: "p",
      text: line,
    });
  });

  if (currentList) {
    blocks.push(currentList);
  }

  return (
    <div className="ai-formatted-container">
      {blocks.map((block, idx) => {
        if (block.type === "h2") {
          return (
            <h4 key={idx} className="ai-section-title">
              {renderInline(block.text)}
            </h4>
          );
        }
        if (block.type === "h3") {
          return (
            <h5 key={idx} className="ai-subsection-title">
              {renderInline(block.text)}
            </h5>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={idx} className="ai-bullet-list">
              {block.items.map((it, itemIdx) => (
                <li key={itemIdx} className="ai-bullet-item">
                  {renderInline(it)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={idx} className="ai-numbered-list">
              {block.items.map((it, itemIdx) => (
                <li key={itemIdx} className="ai-numbered-item">
                  {renderInline(it)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="ai-paragraph">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
