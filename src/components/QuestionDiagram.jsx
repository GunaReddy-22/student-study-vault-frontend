import React from "react";

/**
 * 🎨 Exam Diagram & Schematic Vector Renderer
 * Renders SVG diagrams for Circuits, Graphs, Pulleys/Dynamics, Logic Gates, Trees, Optics & Biology
 */
export default function QuestionDiagram({ diagramSvg, diagramType, questionText = "" }) {
  // If raw SVG string provided from backend
  if (diagramSvg && typeof diagramSvg === "string" && diagramSvg.includes("<svg")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">📊 Figure / Schematic</div>
        <div
          className="diagram-svg-host"
          dangerouslySetInnerHTML={{ __html: diagramSvg }}
        />
      </div>
    );
  }

  const text = (questionText || "").toLowerCase();

  // 1. Logic Gate Circuit
  if (diagramType === "logic_gate" || text.includes("logic gate") || text.includes("truth table") || text.includes("nand") || text.includes("flip-flop")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">⚡ Logic Gate Circuit Diagram</div>
        <svg viewBox="0 0 400 160" className="cbt-diagram-svg">
          {/* Background grid */}
          <rect width="400" height="160" rx="12" fill="#0b1329" stroke="#1e293b" strokeWidth="1" />
          
          {/* Inputs */}
          <line x1="40" y1="50" x2="110" y2="50" stroke="#38bdf8" strokeWidth="2.5" />
          <text x="25" y="55" fill="#38bdf8" fontSize="14" fontWeight="bold">A</text>
          
          <line x1="40" y1="80" x2="110" y2="80" stroke="#38bdf8" strokeWidth="2.5" />
          <text x="25" y="85" fill="#38bdf8" fontSize="14" fontWeight="bold">B</text>

          {/* AND Gate 1 */}
          <path d="M 110 35 L 140 35 A 25 25 0 0 1 140 95 L 110 95 Z" fill="#1e293b" stroke="#818cf8" strokeWidth="2.5" />
          <text x="120" y="70" fill="#cbd5e1" fontSize="11" fontWeight="bold">AND</text>
          
          {/* AND Output */}
          <line x1="165" y1="65" x2="230" y2="65" stroke="#818cf8" strokeWidth="2.5" />
          <text x="185" y="55" fill="#94a3b8" fontSize="10">A·B</text>

          {/* Input C */}
          <line x1="40" y1="120" x2="230" y2="120" stroke="#38bdf8" strokeWidth="2.5" />
          <text x="25" y="125" fill="#38bdf8" fontSize="14" fontWeight="bold">C</text>

          {/* OR Gate */}
          <path d="M 230 50 Q 255 92 230 135 Q 285 130 310 92 Q 285 55 230 50 Z" fill="#1e293b" stroke="#34d399" strokeWidth="2.5" />
          <text x="252" y="97" fill="#cbd5e1" fontSize="11" fontWeight="bold">OR</text>

          {/* Output Y */}
          <line x1="310" y1="92" x2="365" y2="92" stroke="#34d399" strokeWidth="2.5" />
          <circle cx="365" cy="92" r="4" fill="#34d399" />
          <text x="375" y="97" fill="#34d399" fontSize="14" fontWeight="bold">Y</text>
        </svg>
      </div>
    );
  }

  // 2. Velocity-Time or Coordinate Physics Graph
  if (diagramType === "graph" || text.includes("velocity-time") || text.includes("v-t graph") || text.includes("displacement-time") || text.includes("p-v diagram") || text.includes("trajectory") || text.includes("projectile")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">📈 Coordinate & Kinematics Graph</div>
        <svg viewBox="0 0 400 180" className="cbt-diagram-svg">
          <rect width="400" height="180" rx="12" fill="#0b1329" stroke="#1e293b" strokeWidth="1" />
          
          {/* Axes */}
          <line x1="50" y1="145" x2="360" y2="145" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="50" y1="145" x2="50" y2="25" stroke="#64748b" strokeWidth="2" />
          
          <text x="365" y="150" fill="#94a3b8" fontSize="12" fontWeight="bold">Time (t / s)</text>
          <text x="35" y="20" fill="#94a3b8" fontSize="12" fontWeight="bold">Velocity (v / m·s⁻¹)</text>
          <text x="40" y="160" fill="#64748b" fontSize="11">O</text>

          {/* Grid lines */}
          <line x1="50" y1="85" x2="350" y2="85" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="170" y1="145" x2="170" y2="85" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="280" y1="145" x2="280" y2="85" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />

          {/* Kinematics Curve (Acceleration -> Uniform -> Deceleration) */}
          <path d="M 50 145 L 140 65 L 240 65 L 330 145" fill="none" stroke="#38bdf8" strokeWidth="3" />
          
          {/* Markers & Points */}
          <circle cx="140" cy="65" r="4" fill="#818cf8" />
          <text x="135" y="52" fill="#818cf8" fontSize="11" fontWeight="bold">A (v_max)</text>

          <circle cx="240" cy="65" r="4" fill="#818cf8" />
          <text x="235" y="52" fill="#818cf8" fontSize="11" fontWeight="bold">B</text>

          <circle cx="330" cy="145" r="4" fill="#f87171" />
          <text x="325" y="165" fill="#f87171" fontSize="11" fontWeight="bold">C (t_total)</text>
        </svg>
      </div>
    );
  }

  // 3. Electrical Circuit Diagram
  if (diagramType === "circuit" || text.includes("resistor") || text.includes("circuit") || text.includes("kirchhoff") || text.includes("wheatstone") || text.includes("capacitor") || text.includes("emf")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">⚡ Electrical Circuit Schematic</div>
        <svg viewBox="0 0 400 160" className="cbt-diagram-svg">
          <rect width="400" height="160" rx="12" fill="#0b1329" stroke="#1e293b" strokeWidth="1" />
          
          {/* Main Loop Wire */}
          <polyline points="60,80 60,35 150,35" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
          
          {/* Resistor R1 (Zigzag) */}
          <polyline points="150,35 155,25 165,45 175,25 185,45 195,25 205,45 210,35" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <text x="170" y="20" fill="#fbbf24" fontSize="12" fontWeight="bold" textAnchor="middle">R₁ = 6 Ω</text>

          <polyline points="210,35 340,35 340,125 230,125" fill="none" stroke="#60a5fa" strokeWidth="2.5" />

          {/* Resistor R2 (Bottom) */}
          <polyline points="230,125 225,115 215,135 205,115 195,135 185,115 175,135 170,125" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <text x="200" y="150" fill="#fbbf24" fontSize="12" fontWeight="bold" textAnchor="middle">R₂ = 4 Ω</text>

          <polyline points="170,125 60,125 60,80" fill="none" stroke="#60a5fa" strokeWidth="2.5" />

          {/* DC Voltage Source (Left) */}
          <line x1="45" y1="72" x2="75" y2="72" stroke="#34d399" strokeWidth="3" />
          <line x1="52" y1="88" x2="68" y2="88" stroke="#34d399" strokeWidth="2" />
          <text x="30" y="84" fill="#34d399" fontSize="12" fontWeight="bold">V₀ = 12V</text>
          <text x="57" y="65" fill="#34d399" fontSize="10">+</text>
          <text x="57" y="102" fill="#34d399" fontSize="10">-</text>

          {/* Current Arrow */}
          <path d="M 90 28 L 115 28" fill="none" stroke="#f472b6" strokeWidth="2" />
          <polygon points="115,25 125,28 115,31" fill="#f472b6" />
          <text x="100" y="22" fill="#f472b6" fontSize="11" fontWeight="bold">i</text>
        </svg>
      </div>
    );
  }

  // 4. Binary Search Tree / Data Structure
  if (diagramType === "tree" || text.includes("binary search tree") || text.includes("avl tree") || text.includes("binary tree") || text.includes("heap") || text.includes("node")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">🌲 Data Structure Tree Model</div>
        <svg viewBox="0 0 400 160" className="cbt-diagram-svg">
          <rect width="400" height="160" rx="12" fill="#0b1329" stroke="#1e293b" strokeWidth="1" />
          
          {/* Tree Branches */}
          <line x1="200" y1="35" x2="130" y2="85" stroke="#64748b" strokeWidth="2" />
          <line x1="200" y1="35" x2="270" y2="85" stroke="#64748b" strokeWidth="2" />
          
          <line x1="130" y1="85" x2="90" y2="135" stroke="#64748b" strokeWidth="2" />
          <line x1="130" y1="85" x2="165" y2="135" stroke="#64748b" strokeWidth="2" />
          <line x1="270" y1="85" x2="310" y2="135" stroke="#64748b" strokeWidth="2" />

          {/* Root Node */}
          <circle cx="200" cy="35" r="18" fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
          <text x="200" y="40" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">50</text>

          {/* Level 1 Nodes */}
          <circle cx="130" cy="85" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="130" y="90" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">30</text>

          <circle cx="270" cy="85" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="270" y="90" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">70</text>

          {/* Level 2 Leaves */}
          <circle cx="90" cy="135" r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <text x="90" y="139" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">20</text>

          <circle cx="165" cy="135" r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <text x="165" y="139" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">40</text>

          <circle cx="310" cy="135" r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <text x="310" y="139" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">85</text>
        </svg>
      </div>
    );
  }

  // 5. Optics / Ray Diagram
  if (diagramType === "optics" || text.includes("ray optics") || text.includes("convex lens") || text.includes("concave mirror") || text.includes("focal length") || text.includes("refraction")) {
    return (
      <div className="question-diagram-wrapper">
        <div className="diagram-badge">🔍 Ray Optics & Lens Diagram</div>
        <svg viewBox="0 0 400 160" className="cbt-diagram-svg">
          <rect width="400" height="160" rx="12" fill="#0b1329" stroke="#1e293b" strokeWidth="1" />
          
          {/* Principal Axis */}
          <line x1="30" y1="80" x2="370" y2="80" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 5" />
          
          {/* Double Convex Lens */}
          <path d="M 200 20 Q 215 80 200 140 Q 185 80 200 20 Z" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="2" />
          <text x="200" y="155" fill="#38bdf8" fontSize="11" textAnchor="middle">Convex Lens</text>

          {/* Focal points */}
          <circle cx="130" cy="80" r="3" fill="#fbbf24" />
          <text x="130" y="96" fill="#fbbf24" fontSize="10" textAnchor="middle">F₁</text>

          <circle cx="270" cy="80" r="3" fill="#fbbf24" />
          <text x="270" y="96" fill="#fbbf24" fontSize="10" textAnchor="middle">F₂</text>

          {/* Object Arrow */}
          <line x1="80" y1="80" x2="80" y2="40" stroke="#f87171" strokeWidth="3" />
          <polygon points="76,42 80,34 84,42" fill="#f87171" />
          <text x="80" y="28" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">Object</text>

          {/* Parallel Ray -> Focus */}
          <line x1="80" y1="40" x2="200" y2="40" stroke="#34d399" strokeWidth="2" />
          <line x1="200" y1="40" x2="320" y2="120" stroke="#34d399" strokeWidth="2" />

          {/* Optical Center Ray */}
          <line x1="80" y1="40" x2="320" y2="120" stroke="#818cf8" strokeWidth="2" />

          {/* Inverted Real Image */}
          <line x1="320" y1="80" x2="320" y2="120" stroke="#38bdf8" strokeWidth="3" />
          <polygon points="316,118 320,126 324,118" fill="#38bdf8" />
          <text x="320" y="140" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">Real Image</text>
        </svg>
      </div>
    );
  }

  return null;
}
