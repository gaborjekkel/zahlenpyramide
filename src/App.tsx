import React, { useEffect, useMemo, useRef, useState } from "react";

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

  // Initialize solution and puzzle together to ensure they match
  const initialData = useMemo(() => {
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

  const rowCount = puzzle.length;
  const wrongKey = new Set(wrongPositions.map(([r, c]) => `${r}-${c}`));

  return (
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
            <div className="flex items-center gap-3">
              <div className="text-5xl">🧱</div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900">{labels.title}</div>
                <div className="text-sm text-gray-700">
                  {statusEmoji} {statusText}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 items-center justify-center">
              <div className="px-4 py-3 rounded-2xl bg-white/70 border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🧩</div>
                  <div>
                    <div className="text-xs font-bold text-gray-600">{labels.solved}</div>
                    <div className="font-extrabold text-xl">{solvedCount}</div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/70 border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🌟</div>
                  <div>
                    <div className="text-xs font-bold text-gray-600">{labels.firstTry}</div>
                    <div className="font-extrabold text-xl">{firstTryCount}</div>
                  </div>
                </div>
              </div>
              <button
                  onClick={newPuzzle}
                  className="ml-auto px-4 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow-md border border-emerald-600"
                  title={labels.newTask}
              >
                <span className="text-2xl">🎲</span>
                <span className="ml-2">{labels.newTask}</span>
              </button>
              <button
                  onClick={() => {
                    setStatusEmoji("🧠");
                    setStatusText("Okay! Versuch's nochmal 💪");
                    setWrongPositions([]);
                    setShowWrongHighlights(false);
                    setHadFirstWrong(false);
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/70 border font-extrabold shadow-sm"
                  title={labels.tryAgain}
              >
                <span className="text-2xl">🔄</span>
                <span className="ml-2">{labels.tryAgain}</span>
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
                                    "w-16 h-14 md:w-20 md:h-16 rounded-2xl border  flex items-center justify-center " +
                                    (cell.given ? "bg-gradient-to-br from-amber-100 to-amber-50" : "bg-white") +
                                    (isWrong ? " border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.35)]" : "")
                                }
                            >
                              {cell.given ? (
                                  <span className="text-xl md:text-2xl font-extrabold text-gray-900">{cell.value}</span>
                              ) : (
                                  <input
                                      inputMode="numeric"
                                      value={cell.input}
                                      onChange={(e) => updateInput(r, c, e.target.value)}
                                      className="w-full h-full text-center rounded-2xl outline-none text-xl md:text-2xl font-extrabold bg-transparent"
                                      aria-label={`Reihe ${r + 1}, Feld ${c + 1}`}
                                  />
                              )}
                            </div>
                        );
                      })}
                    </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-700 flex items-center justify-between gap-2 flex-wrap">
                <div className="px-3 py-2 rounded-2xl bg-white/70 border">
                  🧮 {rowCount} Reihen • {totalCells(rowCount)} Steine
                </div>
                <div className="px-3 py-2 rounded-2xl bg-white/70 border">
                  {showWrongHighlights ? "🔴 Fehler-Markierung: AN" : "🫣 Fehler-Markierung: AUS"}
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                (Erst 😕 Hinweis, dann beim nächsten Versuch 🔴 – und Rot verschwindet sofort, wenn's richtig ist.)
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="rounded-2xl bg-white/70 border p-3">
                <div className="text-sm font-extrabold">📏 {labels.rows}</div>
                <input
                    type="number"
                    min={3}
                    max={20}
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="mt-2 w-full bg-white/70 rounded-xl border  px-3 py-2 text-lg font-extrabold outline-none"
                />
              </label>

              <label className="rounded-2xl bg-white/70 border p-3">
                <div className="text-sm font-extrabold">💪 {labels.diff}</div>
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="mt-2 w-full bg-white/70 rounded-xl border  px-3 py-2 text-lg font-extrabold outline-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                  ))}
                </select>
              </label>

              <label className="rounded-2xl bg-white/70 border p-3">
                <div className="text-sm font-extrabold">🏔️ {labels.peak}</div>
                <input
                    type="number"
                    min={1}
                    value={topMax}
                    onChange={(e) => setTopMax(Number(e.target.value))}
                    className="mt-2 w-full bg-white/70 rounded-xl border  px-3 py-2 text-lg font-extrabold outline-none"
                />
              </label>
            </div>

            <div className="mt-3 flex justify-center">
              <button
                  onClick={resetStats}
                  className="px-4 py-3 rounded-2xl bg-white/70 border shadow-sm font-extrabold"
                  title={labels.reset}
              >
                <span className="text-2xl">🧼</span>
                <span className="ml-2">{labels.reset}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
