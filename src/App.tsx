import { useEffect, useMemo, useRef, useState } from "react";

type Cell = {
  given: boolean;
  value: number;
  input: string;
};

type Puzzle = Cell[][];
type Pos = [number, number];

function clampInt(n: unknown, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.trunc(x)));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function totalCells(rows: number) {
  return (rows * (rows + 1)) / 2;
}

function buildSolutionPyramid(rows: number, topMax: number, maxAttempts = 9000) {
  const bottomMin = 0;
  const bottomMax = 9;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pyr: number[][] = [];
    const bottom = Array.from({ length: rows }, () => randInt(bottomMin, bottomMax));
    pyr.push(bottom);

    for (let r = rows - 1; r >= 1; r--) {
      const prev = pyr[pyr.length - 1];
      const next = Array.from({ length: r }, (_, i) => prev[i] + prev[i + 1]);
      pyr.push(next);
    }

    const topValue = pyr[pyr.length - 1][0];
    if (topValue <= topMax) return pyr.reverse(); // top->bottom
  }

  throw new Error("😵‍💫 Keine gültige Pyramide gefunden. Erhöhe die Spitze max oder nutze weniger Reihen.");
}

function makeGivenMask(solution: number[][], difficulty: number) {
  const rows = solution.length;
  const cells = totalCells(rows);

  const ratios: Record<number, number> = { 1: 0.72, 2: 0.58, 3: 0.42, 4: 0.3, 5: 0.22 };
  const ratio = ratios[difficulty] ?? 0.42;
  const target = Math.max(rows, Math.round(cells * ratio));

  const mask = solution.map((row) => row.map(() => false));

  for (let r = 0; r < rows; r++) mask[r][randInt(0, solution[r].length - 1)] = true;
  mask[0][0] = true;

  let current = mask.flat().filter(Boolean).length;

  const positions: Pos[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < solution[r].length; c++) positions.push([r, c]);
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [r, c] of positions) {
    if (current >= target) break;
    if (!mask[r][c]) {
      mask[r][c] = true;
      current++;
    }
  }

  return mask;
}

function makePuzzleFromSolution(solution: number[][], givenMask: boolean[][]): Puzzle {
  return solution.map((row, r) =>
      row.map((value, c) => ({
        given: Boolean(givenMask?.[r]?.[c]),
        value,
        input: "",
      }))
  );
}

function isFilled(str: string) {
  return String(str).trim().length > 0;
}

function cleanNumericInput(next: string) {
  const cleaned = String(next).replace(/[^0-9]/g, "");
  return cleaned.slice(0, 4);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Üres mező is hiba + rossz szám is hiba
function getWrongPositions(puzzle: Puzzle, solution: number[][]) {
  const wrong: Pos[] = [];
  let allFilled = true;

  for (let r = 0; r < puzzle.length; r++) {
    for (let c = 0; c < puzzle[r].length; c++) {
      const cell = puzzle[r][c];
      if (cell.given) continue;

      if (!isFilled(cell.input)) {
        allFilled = false;
        wrong.push([r, c]);
        continue;
      }

      const actual = Number(cell.input);
      const expected = solution[r][c];
      if (!Number.isFinite(actual) || actual !== expected) wrong.push([r, c]);
    }
  }

  return { allFilled, wrongPositions: wrong };
}

export default function NumberPyramidPuzzle() {
  // defaults
  const [rows, setRows] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [topMax, setTopMax] = useState<number>(20);

  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [firstTryCount, setFirstTryCount] = useState<number>(0);

  // Session timer - load from localStorage immediately
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("np_session_v1");
      if (raw) {
        const saved = JSON.parse(raw) as { sessionStartTime?: number; lastActivity?: number };
        const now = Date.now();
        const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        // If last activity was within 5 minutes, restore session
        if (saved.lastActivity && now - saved.lastActivity < SESSION_TIMEOUT) {
          return saved.sessionStartTime || Date.now();
        } else {
          // Session expired - clear old data
          localStorage.removeItem("np_session_v1");
        }
      }
    } catch {
      // ignore
    }
    return Date.now();
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Initialize solution and puzzle together to ensure they match
  const initialData = useMemo(() => {
    // Try to restore from localStorage first
    try {
      const raw = localStorage.getItem("np_session_v1");
      if (raw) {
        const saved = JSON.parse(raw) as {
          sessionStartTime?: number;
          lastActivity?: number;
          solution?: number[][];
          puzzle?: Puzzle;
        };
        const now = Date.now();
        const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        // If last activity was within 5 minutes, restore puzzle
        if (saved.lastActivity && now - saved.lastActivity < SESSION_TIMEOUT && saved.solution && saved.puzzle) {
          return { solution: saved.solution, puzzle: saved.puzzle };
        }
      }
    } catch {
      // ignore
    }

    // Generate new puzzle
    const sol = buildSolutionPyramid(3, 20);
    const mask = makeGivenMask(sol, 3);
    const puz = makePuzzleFromSolution(sol, mask);
    return { solution: sol, puzzle: puz };
  }, []);

  const [solution, setSolution] = useState<number[][]>(initialData.solution);
  const [puzzle, setPuzzle] = useState<Puzzle>(initialData.puzzle);

  const [statusEmoji, setStatusEmoji] = useState<string>("🧠");
  const [statusText, setStatusText] = useState<string>("Trag Zahlen in die leeren Steine ein!");

  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [oops, setOops] = useState<boolean>(false);
  const celebrateTimer = useRef<number | null>(null);
  const oopsTimer = useRef<number | null>(null);

  const [wrongPositions, setWrongPositions] = useState<Pos[]>([]);
  const [showWrongHighlights, setShowWrongHighlights] = useState<boolean>(false);
  const [hadFirstWrong, setHadFirstWrong] = useState<boolean>(false);
  const [checksThisPuzzle, setChecksThisPuzzle] = useState<number>(0);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const lastCheckedSignatureRef = useRef<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("np_stats_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { solved?: number; firstTry?: number };
      if (typeof parsed.solved === "number") setSolvedCount(parsed.solved);
      if (typeof parsed.firstTry === "number") setFirstTryCount(parsed.firstTry);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("np_stats_v1", JSON.stringify({ solved: solvedCount, firstTry: firstTryCount }));
    } catch {
      // ignore
    }
  }, [solvedCount, firstTryCount]);

  // Restore other session data on mount
  // ANTI-CHEAT: Timer keeps running even if page is refreshed!
  // Session only resets after 5 minutes of inactivity
  useEffect(() => {
    try {
      const raw = localStorage.getItem("np_session_v1");
      if (!raw) return;

      const saved = JSON.parse(raw) as {
        lastActivity?: number;
        rows?: number;
        difficulty?: number;
        topMax?: number;
        checksThisPuzzle?: number;
        hadFirstWrong?: boolean;
        showWrongHighlights?: boolean;
      };

      const now = Date.now();
      const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

      // Only restore if session is recent (within 5 minutes)
      if (saved.lastActivity && now - saved.lastActivity < SESSION_TIMEOUT) {
        if (typeof saved.rows === "number") setRows(saved.rows);
        if (typeof saved.difficulty === "number") setDifficulty(saved.difficulty);
        if (typeof saved.topMax === "number") setTopMax(saved.topMax);
        if (typeof saved.checksThisPuzzle === "number") setChecksThisPuzzle(saved.checksThisPuzzle);
        if (typeof saved.hadFirstWrong === "boolean") setHadFirstWrong(saved.hadFirstWrong);
        if (typeof saved.showWrongHighlights === "boolean") setShowWrongHighlights(saved.showWrongHighlights);
      } else {
        // Session expired, clear it
        localStorage.removeItem("np_session_v1");
      }
    } catch {
      // ignore
    }
  }, []);

  // Save session to localStorage whenever it changes + update last activity
  useEffect(() => {
    try {
      const sessionData = {
        sessionStartTime,
        lastActivity: Date.now(), // Track when user was last active
        solution,
        puzzle,
        rows,
        difficulty,
        topMax,
        checksThisPuzzle,
        hadFirstWrong,
        showWrongHighlights,
      };
      localStorage.setItem("np_session_v1", JSON.stringify(sessionData));
    } catch {
      // ignore
    }
  }, [sessionStartTime, solution, puzzle, rows, difficulty, topMax, checksThisPuzzle, hadFirstWrong, showWrongHighlights]);

  // Update last activity on any user interaction
  useEffect(() => {
    const updateActivity = () => {
      try {
        const raw = localStorage.getItem("np_session_v1");
        if (raw) {
          const saved = JSON.parse(raw);
          saved.lastActivity = Date.now();
          localStorage.setItem("np_session_v1", JSON.stringify(saved));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);

    return () => {
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, []);

  // Update elapsed time every second and check for session timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      setElapsedSeconds(elapsed);

      // Check if session has been inactive for too long (e.g., page left open but idle)
      try {
        const raw = localStorage.getItem("np_session_v1");
        if (raw) {
          const saved = JSON.parse(raw);
          const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
          if (saved.lastActivity && now - saved.lastActivity > SESSION_TIMEOUT) {
            // Session expired - reset timer
            const newStartTime = Date.now();
            setSessionStartTime(newStartTime);
            localStorage.removeItem("np_session_v1");
          }
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Close menu with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const labels = useMemo(
      () => ({
        title: "ZAHLENPYRAMIDE",
        solved: "Gelöst",
        firstTry: "Erstes Mal",
        reset: "Zurücksetzen",
        rows: "Reihen",
        diff: "Schwierigkeit",
        peak: "Spitze max (≤)",
        newTask: "Neue Aufgabe",
        tryAgain: "Nochmal",
        settings: "Einstellungen",
      }),
      []
  );

  function startCelebrate() {
    setCelebrate(true);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => setCelebrate(false), 4500);
  }

  function startOops() {
    setOops(true);
    if (oopsTimer.current) window.clearTimeout(oopsTimer.current);
    oopsTimer.current = window.setTimeout(() => setOops(false), 3500);
  }

  function resetPerPuzzleState() {
    setChecksThisPuzzle(0);
    setWrongPositions([]);
    setShowWrongHighlights(false);
    setHadFirstWrong(false);
    setStatusEmoji("🧠");
    setStatusText("Trag Zahlen in die leeren Steine ein!");
    setCelebrate(false);
    setOops(false);
    lastCheckedSignatureRef.current = "";
  }

  function validateSettings() {
    const r = clampInt(rows, 3, 20);
    const diff = clampInt(difficulty, 1, 5);
    const tMax = Number(topMax);

    if (!Number.isInteger(r) || r < 3 || r > 20) return { ok: false as const, msg: "📏 3–20 Reihen" };
    if (!Number.isInteger(diff) || diff < 1 || diff > 5) return { ok: false as const, msg: "💪 1–5 Schwierigkeit" };
    if (!Number.isFinite(tMax) || !Number.isInteger(tMax) || tMax <= 0)
      return { ok: false as const, msg: "🏔️ Spitzen-Max muss positiv sein" };

    return { ok: true as const, r, diff, tMax };
  }

  function newPuzzle() {
    const v = validateSettings();
    if (!v.ok) {
      setStatusEmoji("⚠️");
      setStatusText(v.msg);
      return;
    }

    let sol: number[][];
    try {
      sol = buildSolutionPyramid(v.r, v.tMax);
    } catch (e) {
      setStatusEmoji("😵‍💫");
      setStatusText((e as Error)?.message || "Ups… das ging nicht");
      return;
    }

    const mask = makeGivenMask(sol, v.diff);
    const puz = makePuzzleFromSolution(sol, mask);

    setSolution(sol);
    setPuzzle(puz);
    resetPerPuzzleState();

    // Timer keeps running across puzzles - only resets after 5 min inactivity
  }

  function onSolved() {
    setSolvedCount((x) => x + 1);
    if (checksThisPuzzle === 0) setFirstTryCount((x) => x + 1);
    setStatusEmoji("🎉");
    setStatusText("SUPER! Geschafft! 🌈");
    startCelebrate();
    setWrongPositions([]);
    setShowWrongHighlights(false);
    setHadFirstWrong(false);
  }

  function evaluateAndReact(currentPuzzle: Puzzle) {
    const { allFilled, wrongPositions: wrong } = getWrongPositions(currentPuzzle, solution);

    if (!allFilled) {
      setStatusEmoji("🧠");
      setStatusText("Trag Zahlen in die leeren Steine ein!");
      return;
    }

    if (wrong.length === 0) {
      onSolved();
      return;
    }

    setChecksThisPuzzle((x) => x + 1);

    if (!hadFirstWrong) {
      setHadFirstWrong(true);
      setStatusEmoji("😕");
      setStatusText("Hmm… da stimmt etwas noch nicht.");
      startOops();
      setWrongPositions([]);
      setShowWrongHighlights(false);
      return;
    }

    setStatusEmoji("🧐");
    setStatusText("Ich markiere die falschen Felder rot. Du schaffst das! 💪");
    setWrongPositions(wrong);
    setShowWrongHighlights(true);
  }

  useEffect(() => {
    const sig = puzzle
        .map((row) => row.map((cell) => (cell.given ? `G${cell.value}` : `I${cell.input}`)).join("|"))
        .join("/");

    const { allFilled } = getWrongPositions(puzzle, solution);
    if (!allFilled) {
      lastCheckedSignatureRef.current = "";
      return;
    }

    if (sig === lastCheckedSignatureRef.current) return;
    lastCheckedSignatureRef.current = sig;

    evaluateAndReact(puzzle);
  }, [puzzle, solution]);

  function updateInput(r: number, c: number, next: string) {
    setPuzzle((prev) => {
      const nextPuzzle: Puzzle = prev.map((row, rr) =>
          row.map((cell, cc) => {
            if (rr !== r || cc !== c) return cell;
            if (cell.given) return cell;
            return { ...cell, input: cleanNumericInput(next) };
          })
      );

      if (showWrongHighlights) {
        const { wrongPositions: wrong } = getWrongPositions(nextPuzzle, solution);
        setWrongPositions(wrong);
      }

      return nextPuzzle;
    });
  }

  function resetStats() {
    setSolvedCount(0);
    setFirstTryCount(0);
    setStatusEmoji("🧼");
    setStatusText("Punkte zurückgesetzt!");
  }

  const wrongKey = new Set(wrongPositions.map(([r, c]) => `${r}-${c}`));

  return (
      <>
        {/* Hamburger Menu Button - Fixed Top Right */}
        <button
            onClick={() => setMenuOpen(true)}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 sm:px-3 sm:py-3 rounded-xl sm:rounded-2xl bg-white border shadow-lg hover:shadow-xl transition-all flex items-center"
            title={labels.settings}
            aria-label={labels.settings}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="rounded-3xl shadow-lg overflow-hidden relative bg-gradient-to-br from-sky-50 via-pink-50 to-emerald-50 border">
          {celebrate && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 200 }).map((_, i) => {
                  const shapes = ['rounded-full', 'rounded-sm', 'rounded-lg'];
                  const sizes = ['w-4 h-4', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7', 'w-8 h-8', 'w-10 h-10'];
                  const particlesPerBurst = 40;
                  const angle = (i * 360) / particlesPerBurst;
                  const burstGroup = Math.floor(i / particlesPerBurst);
                  const burstPositions = [
                    { x: 20, y: 25 },
                    { x: 50, y: 15 },
                    { x: 80, y: 25 },
                    { x: 35, y: 50 },
                    { x: 65, y: 50 }
                  ];
                  const burst = burstPositions[burstGroup] || { x: 50, y: 30 };
                  const velocity = 200 + Math.random() * 150;

                  return (
                      <div
                          key={i}
                          className={`absolute ${shapes[Math.floor(Math.random() * shapes.length)]} ${sizes[Math.floor(Math.random() * sizes.length)]}`}
                          style={{
                            left: `${burst.x}%`,
                            top: `${burst.y}%`,
                            backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#fbbf24', '#a78bfa', '#fb923c', '#34d399'][Math.floor(Math.random() * 12)],
                            animation: `firework-${i} ${2 + Math.random() * 0.8}s ease-out forwards`,
                            animationDelay: `${burstGroup * 0.2 + Math.random() * 0.1}s`,
                          }}
                      >
                        <style>{`
                          @keyframes firework-${i} {
                            0% {
                              transform: translate(0, 0) scale(0.1);
                              opacity: 1;
                            }
                            30% {
                              transform: translate(${Math.cos(angle * Math.PI / 180) * velocity * 0.4}px, ${Math.sin(angle * Math.PI / 180) * velocity * 0.4 + 30}px) scale(1.2);
                              opacity: 1;
                            }
                            100% {
                              transform: translate(${Math.cos(angle * Math.PI / 180) * velocity}px, ${Math.sin(angle * Math.PI / 180) * velocity + 150}px) scale(0.8) rotate(${angle * 3}deg);
                              opacity: 0;
                            }
                          }
                        `}</style>
                      </div>
                  );
                })}
                <div className="absolute left-1/2 top-8 -translate-x-1/2 text-center z-10">
                  <div className="text-8xl drop-shadow animate-bounce">🌟</div>
                  <div className="mt-2 inline-block px-6 py-3 rounded-full bg-white/90 border font-black shadow animate-pulse text-xl">
                    GESCHAFFT! 🎈🎉
                  </div>
                </div>
              </div>
          )}

          {oops && (
              <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
                <div className="mt-10 text-center">
                  <div className="text-7xl drop-shadow">😕</div>
                  <div className="mt-2 inline-block px-4 py-2 rounded-full bg-white/90 border font-black shadow">
                    Nicht ganz richtig – schau nochmal 👀
                  </div>
                </div>
              </div>
          )}

          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 pr-12 sm:pr-0">
              <div className="text-4xl sm:text-5xl">🧱</div>
              <div className="flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{labels.title}</div>
                <div className="text-xs sm:text-sm text-gray-700">
                  {statusEmoji} {statusText}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-center">
              <button
                  onClick={newPuzzle}
                  className="px-4 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow-md border border-emerald-600 flex items-center justify-center"
                  title={labels.newTask}
              >
                <span className="text-xl sm:text-2xl">🎲</span>
                <span className="ml-2 text-sm sm:text-base">{labels.newTask}</span>
              </button>
              <button
                  onClick={() => {
                    setStatusEmoji("🧠");
                    setStatusText("Okay! Versuch's nochmal 💪");
                    setWrongPositions([]);
                    setShowWrongHighlights(false);
                    setHadFirstWrong(false);
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/70 border font-extrabold shadow-sm flex items-center justify-center"
                  title={labels.tryAgain}
              >
                <span className="text-xl sm:text-2xl">🔄</span>
                <span className="ml-2 text-sm sm:text-base">{labels.tryAgain}</span>
              </button>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="rounded-3xl bg-white/70 border p-4 md:p-6">
              <div className="space-y-3">
                {puzzle.map((row, r) => (
                    <div key={r} className="flex justify-center gap-2">
                      {row.map((cell, c) => {
                        const isWrong = showWrongHighlights && wrongKey.has(`${r}-${c}`);
                        return (
                            <div
                                key={`${r}-${c}`}
                                className={
                                    "w-12 h-11 sm:w-16 sm:h-14 md:w-20 md:h-16 rounded-xl sm:rounded-2xl border flex items-center justify-center " +
                                    (cell.given ? "bg-gradient-to-br from-amber-100 to-amber-50" : "bg-white") +
                                    (isWrong ? " border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.35)]" : "")
                                }
                            >
                              {cell.given ? (
                                  <span className="text-base sm:text-xl md:text-2xl font-extrabold text-gray-900">{cell.value}</span>
                              ) : (
                                  <input
                                      inputMode="numeric"
                                      value={cell.input}
                                      onChange={(e) => updateInput(r, c, e.target.value)}
                                      className="w-full h-full text-center rounded-xl sm:rounded-2xl outline-none text-base sm:text-xl md:text-2xl font-extrabold bg-transparent"
                                      aria-label={`Reihe ${r + 1}, Feld ${c + 1}`}
                                  />
                              )}
                            </div>
                        );
                      })}
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Menu Overlay */}
          {menuOpen && (
              <>
                <div
                    className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                    onClick={() => setMenuOpen(false)}
                />
                <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gradient-to-br from-sky-50 via-pink-50 to-emerald-50 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
                  <div className="p-6 pb-20">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="text-3xl">⚙️</span>
                        {labels.settings}
                      </h2>
                      <button
                          onClick={() => setMenuOpen(false)}
                          className="px-3 py-3 rounded-2xl bg-white/70 border shadow-sm hover:bg-white transition-colors flex items-center"
                          aria-label="Schließen"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Stats Display in Menu */}
                    <div className="mb-6 space-y-3">
                      {/* Timer */}
                      <div className="rounded-2xl bg-white/70 border p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">⏱️</div>
                          <div>
                            <div className="text-xs font-bold text-gray-600">Gesamte Session-Zeit</div>
                            <div className="text-3xl font-extrabold text-gray-900">{formatTime(elapsedSeconds)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Gelöst and Erstes Mal */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/70 border p-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="text-3xl">🧩</div>
                            <div>
                              <div className="text-xs font-bold text-gray-600">{labels.solved}</div>
                              <div className="text-2xl font-extrabold text-gray-900">{solvedCount}</div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/70 border p-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="text-3xl">🌟</div>
                            <div>
                              <div className="text-xs font-bold text-gray-600">{labels.firstTry}</div>
                              <div className="text-2xl font-extrabold text-gray-900">{firstTryCount}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block rounded-2xl bg-white/70 border p-4">
                        <div className="text-sm font-extrabold mb-2">📏 {labels.rows}</div>
                        <input
                            type="number"
                            min={3}
                            max={20}
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                            className="w-full bg-white/70 rounded-xl border px-3 py-2 text-lg font-extrabold outline-none"
                        />
                      </label>

                      <label className="block rounded-2xl bg-white/70 border p-4">
                        <div className="text-sm font-extrabold mb-2">💪 {labels.diff}</div>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                            className="w-full bg-white/70 rounded-xl border px-3 py-2 text-lg font-extrabold outline-none"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                          ))}
                        </select>
                      </label>

                      <label className="block rounded-2xl bg-white/70 border p-4">
                        <div className="text-sm font-extrabold mb-2">🏔️ {labels.peak}</div>
                        <input
                            type="number"
                            min={1}
                            value={topMax}
                            onChange={(e) => setTopMax(Number(e.target.value))}
                            className="w-full bg-white/70 rounded-xl border px-3 py-2 text-lg font-extrabold outline-none"
                        />
                      </label>

                      <div className="pt-4">
                        <button
                            onClick={() => {
                              resetStats();
                              setMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 rounded-2xl bg-white/70 border shadow-sm font-extrabold hover:bg-white transition-colors flex items-center justify-center"
                            title={labels.reset}
                        >
                          <span className="text-2xl">🧼</span>
                          <span className="ml-2">{labels.reset}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
          )}
          </div>
        </div>
      </>
  );
}
