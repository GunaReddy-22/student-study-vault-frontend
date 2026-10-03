import { useState, useEffect, useRef } from "react";
import { lookupDictionaryWord } from "../services/freeResourcesApi";
import "./GlobalStudyCompanion.css";
import {
  FiClock,
  FiBookOpen,
  FiVolume2,
  FiVolumeX,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiSearch,
  FiX,
  FiMinus,
  FiPlus,
  FiCheck,
} from "react-icons/fi";

export default function GlobalStudyCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState("pomodoro"); // 'pomodoro' | 'dict' | 'calc'

  // --- Pomodoro State ---
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' (25) | 'shortBreak' (5) | 'deepWork' (50)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState("none"); // 'none' | 'lofi' | 'rain' | 'whitenoise' | 'library'

  // Web Audio Synth references
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);

  // --- Dictionary State ---
  const [dictInput, setDictInput] = useState("");
  const [dictData, setDictData] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);

  // --- Quick Calculator State ---
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playAlarmChime();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const switchTimerMode = (mode) => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === "focus") setTimeLeft(25 * 60);
    else if (mode === "shortBreak") setTimeLeft(5 * 60);
    else if (mode === "deepWork") setTimeLeft(50 * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    switchTimerMode(timerMode);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // --- Web Audio Synthesizer for Ambient Sounds ---
  const stopAmbientAudio = () => {
    synthNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (_) {}
    });
    synthNodesRef.current = [];
  };

  const startAmbientSound = (type) => {
    stopAmbientAudio();
    if (type === "none") return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "lofi") {
        // Binaural calm sine wave (432Hz + 438Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(438, ctx.currentTime);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        synthNodesRef.current = [osc1, osc2, gain];
      } else if (type === "rain" || type === "whitenoise" || type === "library") {
        // Noise buffer synth
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === "rain" || type === "library") {
            output[i] = (lastOut + 0.02 * white) / 1.02; // Pink/Brownian noise for rain
            lastOut = output[i];
          } else {
            output[i] = white * 0.05; // Gentle white noise
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === "rain" ? "lowpass" : type === "library" ? "bandpass" : "highpass";
        filter.frequency.setValueAtTime(type === "rain" ? 800 : type === "library" ? 400 : 1200, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start();
        synthNodesRef.current = [whiteNoise, filter, gain];
      }
    } catch (err) {
      console.error("Audio synth error:", err);
    }
  };

  const handleAmbientChange = (type) => {
    setAmbientSound(type);
    startAmbientSound(type);
  };

  const playAlarmChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current || new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (_) {}
  };

  useEffect(() => {
    return () => stopAmbientAudio();
  }, []);

  // Quick Dictionary Search
  const handleDictSearch = async (e) => {
    e.preventDefault();
    if (!dictInput.trim()) return;
    setDictLoading(true);
    try {
      const data = await lookupDictionaryWord(dictInput);
      setDictData(data);
    } catch (_) {}
    finally {
      setDictLoading(false);
    }
  };

  // Quick Calculator Evaluate
  const evaluateCalc = (e) => {
    e.preventDefault();
    try {
      // Safe math evaluator for basic study formulas
      const sanitized = calcInput.replace(/[^0-9+\-*/().^%sqrtPIE \t]/gi, "");
      const jsMath = sanitized
        .replace(/\^/g, "**")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/PI/g, "Math.PI")
        .replace(/E/g, "Math.E");
      
      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${jsMath})`)();
      setCalcResult(String(res));
    } catch (err) {
      setCalcResult("Error");
    }
  };

  return (
    <>
      {/* 🚀 FLOATING TRIGGER DOCK */}
      <button
        className={`study-companion-dock-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Study Tools & Pomodoro Timer"
        aria-label="Toggle Study Tools"
      >
        <span className="dock-icon">{isRunning ? "⏱️" : "⚡"}</span>
        <span className="dock-label">{isRunning ? formatTime(timeLeft) : "Study Tools"}</span>
      </button>

      {/* 🪟 FLOATING STUDY PANEL */}
      {isOpen && (
        <div className="study-companion-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-badge">🎒 Student Toolkit</span>
            </div>
            <button className="panel-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          {/* Sub-tools Navigation */}
          <div className="panel-nav">
            <button
              className={`panel-nav-btn ${activeTool === "pomodoro" ? "active" : ""}`}
              onClick={() => setActiveTool("pomodoro")}
            >
              <FiClock /> <span>Focus Timer</span>
            </button>
            <button
              className={`panel-nav-btn ${activeTool === "dict" ? "active" : ""}`}
              onClick={() => setActiveTool("dict")}
            >
              <FiBookOpen /> <span>Lexicon</span>
            </button>
            <button
              className={`panel-nav-btn ${activeTool === "calc" ? "active" : ""}`}
              onClick={() => setActiveTool("calc")}
            >
              <span>🧮 Calculator</span>
            </button>
          </div>

          {/* ================= POMODORO TIMER & SOUNDS ================= */}
          {activeTool === "pomodoro" && (
            <div className="companion-body pomodoro-view">
              <div className="timer-mode-pills">
                <button
                  className={`timer-mode-pill ${timerMode === "focus" ? "active" : ""}`}
                  onClick={() => switchTimerMode("focus")}
                >
                  25m Focus
                </button>
                <button
                  className={`timer-mode-pill ${timerMode === "shortBreak" ? "active" : ""}`}
                  onClick={() => switchTimerMode("shortBreak")}
                >
                  5m Break
                </button>
                <button
                  className={`timer-mode-pill ${timerMode === "deepWork" ? "active" : ""}`}
                  onClick={() => switchTimerMode("deepWork")}
                >
                  50m Deep
                </button>
              </div>

              <div className="timer-display-clock">
                <span className="clock-digits">{formatTime(timeLeft)}</span>
                <span className="clock-status">{isRunning ? "🧠 In the zone..." : "Ready to focus"}</span>
              </div>

              <div className="timer-actions-row">
                <button
                  className={`btn-timer-toggle ${isRunning ? "running" : ""}`}
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? <><FiPause /> Pause</> : <><FiPlay /> Start</>}
                </button>
                <button className="btn-timer-reset" onClick={resetTimer} title="Reset Timer">
                  <FiRotateCcw />
                </button>
              </div>

              {/* Ambient Sound Synthesizer */}
              <div className="ambient-sound-section">
                <label className="ambient-label">
                  <FiVolume2 /> Ambient Audio Synthesizer:
                </label>
                <div className="ambient-pills-row">
                  {[
                    { id: "none", label: "🔇 Mute" },
                    { id: "lofi", label: "🎧 432Hz Sine" },
                    { id: "rain", label: "🌧️ Rain" },
                    { id: "whitenoise", label: "🌊 White Noise" },
                    { id: "library", label: "☕ Cafe Hum" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      className={`ambient-pill ${ambientSound === s.id ? "active" : ""}`}
                      onClick={() => handleAmbientChange(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= INSTANT DICTIONARY ================= */}
          {activeTool === "dict" && (
            <div className="companion-body dict-view">
              <form onSubmit={handleDictSearch} className="mini-search-form">
                <input
                  type="text"
                  placeholder="Look up academic word..."
                  value={dictInput}
                  onChange={(e) => setDictInput(e.target.value)}
                />
                <button type="submit" disabled={dictLoading}><FiSearch /></button>
              </form>

              {dictLoading ? (
                <p className="mini-loading">Searching lexicon...</p>
              ) : dictData ? (
                <div className="mini-dict-result">
                  <div className="mini-dict-header">
                    <h4>{dictData.word}</h4>
                    {dictData.phonetic && <span className="phonetic">{dictData.phonetic}</span>}
                  </div>
                  <div className="mini-def-scroll">
                    {dictData.meanings.map((m, i) => (
                      <div key={i} className="mini-def-item">
                        <span className="mini-pos">{m.partOfSpeech}</span>
                        <p>{m.definitions[0]?.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mini-placeholder">Type any vocabulary or technical term above to inspect its definition.</p>
              )}
            </div>
          )}

          {/* ================= SCIENTIFIC CALCULATOR ================= */}
          {activeTool === "calc" && (
            <div className="companion-body calc-view">
              <form onSubmit={evaluateCalc} className="mini-calc-form">
                <input
                  type="text"
                  placeholder="e.g. 24 * 1.5 + sqrt(144) or PI * 5^2"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                />
                <button type="submit">Calculate</button>
              </form>

              {calcResult && (
                <div className="calc-result-display">
                  <span className="calc-label">Result:</span>
                  <span className="calc-val">{calcResult}</span>
                </div>
              )}

              <div className="calc-quick-constants">
                <span className="const-tag" onClick={() => setCalcInput((c) => c + "PI")}>π (3.14159)</span>
                <span className="const-tag" onClick={() => setCalcInput((c) => c + "E")}>e (2.71828)</span>
                <span className="const-tag" onClick={() => setCalcInput((c) => c + "sqrt(")}>sqrt(x)</span>
                <span className="const-tag" onClick={() => setCalcInput((c) => c + "^2")}>x²</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
