import React from "react";

/**
 * 🧮 Mathematical & Scientific Typography Formatter
 * Formats powers (e.g. M^1 L^2 T^-2, x^2, 10^-5), subscripts (e.g. v_x, H2O, I_cm),
 * Greek letters, square roots, and scientific units.
 */
export default function FormattedMathText({ text, className = "" }) {
  if (!text) return null;

  // Process and tokenize text
  const formatContent = (str) => {
    if (typeof str !== "string") return str;

    // 1. Replace Greek letter names and symbols
    let processed = str
      .replace(/\\times/g, " × ")
      .replace(/\\approx/g, " ≈ ")
      .replace(/\\neq/g, " ≠ ")
      .replace(/\\leq/g, " ≤ ")
      .replace(/\\geq/g, " ≥ ")
      .replace(/\\pm/g, " ± ")
      .replace(/\\theta\b/gi, "θ")
      .replace(/\\alpha\b/gi, "α")
      .replace(/\\beta\b/gi, "β")
      .replace(/\\gamma\b/gi, "γ")
      .replace(/\\lambda\b/gi, "λ")
      .replace(/\\mu\b/gi, "μ")
      .replace(/\\pi\b/gi, "π")
      .replace(/\\omega\b/gi, "ω")
      .replace(/\\Omega\b/gi, "Ω")
      .replace(/\\Delta\b/gi, "Δ")
      .replace(/\\epsilon\b/gi, "ε")
      .replace(/\\rho\b/gi, "ρ")
      .replace(/\\eta\b/gi, "η")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/sqrt\(([^)]+)\)/g, "√($1)");

    // 2. Convert standard scientific powers like M^1 L^2 T^-2, 10^-8, v^2, x^(-3/2), x^(1/2)
    // Matches expressions like (letter or number or word)^(exponent)
    processed = processed.replace(/([A-Za-z0-9)\]])\^\{?(-?[0-9a-zA-Z\/\.\+\-]+)\}?/g, "$1<sup>$2</sup>");

    // 3. Convert subscripts like v_x, v_b, I_cm, S_n, mu_s, etc.
    processed = processed.replace(/([A-Za-z])\_\{?([0-9a-zA-Z\/\.\+\-]+)\}?/g, "$1<sub>$2</sub>");

    // 4. Common chemical formulas like H2O, CO2, O2, N2, H2SO4, CaCO3, CH4, C2H5OH, NO2
    processed = processed.replace(/\bH2O\b/g, "H<sub>2</sub>O")
      .replace(/\bCO2\b/g, "CO<sub>2</sub>")
      .replace(/\bO2\b/g, "O<sub>2</sub>")
      .replace(/\bN2\b/g, "N<sub>2</sub>")
      .replace(/\bCH4\b/g, "CH<sub>4</sub>")
      .replace(/\bSO4\b/g, "SO<sub>4</sub>")
      .replace(/\bNO2\b/g, "NO<sub>2</sub>")
      .replace(/\bH2SO4\b/g, "H<sub>2</sub>SO<sub>4</sub>")
      .replace(/\bCaCO3\b/g, "CaCO<sub>3</sub>");

    return processed;
  };

  const formattedHtml = formatContent(text);

  return (
    <span
      className={`formatted-math-text ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
