import { useEffect, useMemo, useState } from "react";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cleanNumericInput(next: string) {
  const cleaned = String(next).replace(/[^0-9]/g, "");
  return cleaned.slice(0, 1);
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

function clampInt(n: unknown, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.trunc(x)));
}

export default function Zehner() {
  const [numberRange, setNumberRange] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("zehner_preferences_v1");
      if (raw) {
        const prefs = JSON.parse(raw) as { numberRange?: string };
        if (prefs.numberRange) return prefs.numberRange;
      }
    } catch {
      // ignore
    }
    return "0-20";
  });

  const [printPages, setPrintPages] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("zehner_preferences_v1");
      if (raw) {
        const prefs = JSON.parse(raw) as { printPages?: number };
        if (typeof prefs.printPages === "number" && prefs.printPages > 0) return prefs.printPages;
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [tens, setTens] = useState<number>(0);
  const [ones, setOnes] = useState<number>(0);
  const [zInput, setZInput] = useState<string>("");
  const [eInput, setEInput] = useState<string>("");
  const [statusEmoji, setStatusEmoji] = useState<string>("🧠");
  const [statusText, setStatusText] = useState<string>("Zähle die Zehner (Z) und Einer (E)!");
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [firstTryCount, setFirstTryCount] = useState<number>(0);
  const [checksThisPuzzle, setChecksThisPuzzle] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Session timer
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("zehner_session_v1");
      if (raw) {
        const saved = JSON.parse(raw) as { sessionStartTime?: number; lastActivity?: number };
        const now = Date.now();
        const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        if (saved.lastActivity && now - saved.lastActivity < SESSION_TIMEOUT) {
          return saved.sessionStartTime || Date.now();
        } else {
          localStorage.removeItem("zehner_session_v1");
        }
      }
    } catch {
      // ignore
    }
    return Date.now();
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zehner_stats_v1");
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
      localStorage.setItem("zehner_stats_v1", JSON.stringify({ solved: solvedCount, firstTry: firstTryCount }));
    } catch {
      // ignore
    }
  }, [solvedCount, firstTryCount]);

  useEffect(() => {
    try {
      localStorage.setItem("zehner_preferences_v1", JSON.stringify({ numberRange, printPages }));
    } catch {
      // ignore
    }
  }, [numberRange, printPages]);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      setElapsedSeconds(elapsed);

      try {
        const raw = localStorage.getItem("zehner_session_v1");
        if (raw) {
          const saved = JSON.parse(raw);
          const SESSION_TIMEOUT = 5 * 60 * 1000;
          if (saved.lastActivity && now - saved.lastActivity > SESSION_TIMEOUT) {
            const newStartTime = Date.now();
            setSessionStartTime(newStartTime);
            localStorage.removeItem("zehner_session_v1");
          }
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Save session to localStorage
  useEffect(() => {
    try {
      const sessionData = {
        sessionStartTime,
        lastActivity: Date.now(),
      };
      localStorage.setItem("zehner_session_v1", JSON.stringify(sessionData));
    } catch {
      // ignore
    }
  }, [sessionStartTime]);

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      try {
        const raw = localStorage.getItem("zehner_session_v1");
        if (raw) {
          const saved = JSON.parse(raw);
          saved.lastActivity = Date.now();
          localStorage.setItem("zehner_session_v1", JSON.stringify(saved));
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
      settings: "Einstellungen",
      solved: "Gelöst",
      firstTry: "Erstes Mal",
      reset: "Zurücksetzen",
      numberRange: "Zahlenbereich",
      printWorksheet: "Übungsblatt drucken",
      printPagesLabel: "Anzahl Seiten",
    }),
    []
  );

  function getRange(range: string): { min: number; max: number } {
    switch (range) {
      case "0-20":
        return { min: 0, max: 20 }; // Full range 0-20, shown as individual circles
      case "0-100":
        return { min: 0, max: 100 }; // Full range 0-100, shown with tens bundling
      default:
        return { min: 0, max: 20 };
    }
  }

  function newPuzzle() {
    const range = getRange(numberRange);
    const number = randInt(range.min, range.max);
    const newTens = Math.floor(number / 10);
    const newOnes = number % 10;
    setTens(newTens);
    setOnes(newOnes);
    setZInput("");
    setEInput("");
    setStatusEmoji("🧠");
    setStatusText("Zähle die Zehner (Z) und Einer (E)!");
    setCelebrate(false);
    setChecksThisPuzzle(0);
  }

  function resetStats() {
    setSolvedCount(0);
    setFirstTryCount(0);
    setStatusEmoji("🧼");
    setStatusText("Punkte zurückgesetzt!");
  }

  function generatePrintableWorksheet() {
    const pages = clampInt(printPages, 1, 10);
    const exercisesPerPage = 15;
    const totalExercises = pages * exercisesPerPage;

    // Generate exercises
    const exercises: Array<{ tens: number; ones: number; total: number }> = [];

    try {
      const range = getRange(numberRange);
      for (let i = 0; i < totalExercises; i++) {
        const number = randInt(range.min, range.max);
        const t = Math.floor(number / 10);
        const o = number % 10;
        exercises.push({ tens: t, ones: o, total: number });
      }
    } catch (e) {
      setStatusEmoji("😵‍💫");
      setStatusText("Ups… Übungsblatt konnte nicht erstellt werden");
      return;
    }

    // Create printable HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setStatusEmoji("⚠️");
      setStatusText("Popup wurde blockiert. Bitte erlaube Popups.");
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zehner und Einer - Übungsblatt</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .visual-container,
      .ten-bundle,
      .stick,
      .band,
      .one-circle {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      background: white;
    }

    .print-button {
      display: block;
      margin: 0 auto 20px;
      padding: 10px 20px;
      font-size: 16px;
      font-weight: bold;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .print-button:hover {
      background: #059669;
    }

    .page {
      page-break-after: always;
      margin-bottom: 30px;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .exercises-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .exercise {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 8px 0;
      border-bottom: 1px solid #ccc;
      page-break-inside: avoid;
    }

    .exercise:last-child {
      border-bottom: none;
    }

    .exercise-number {
      font-size: 12px;
      font-weight: bold;
      color: #000;
      min-width: 60px;
      flex-shrink: 0;
    }

    .visual-container {
      display: flex;
      justify-content: flex-start;
      align-items: flex-end;
      gap: 4px;
      min-height: 50px;
      flex-wrap: wrap;
      padding: 5px;
      flex: 1;
    }

    .ten-bundle {
      position: relative;
      display: inline-flex;
      gap: 1px;
      margin: 0 2px;
    }

    .stick {
      width: 3px;
      height: 50px;
      background-color: #ea580c;
      border: 1px solid #c2410c;
      display: inline-block;
    }

    .band {
      position: absolute;
      top: 50%;
      left: -2px;
      right: -2px;
      height: 5px;
      background-color: #dc2626;
      border: 1px solid #991b1b;
      transform: translateY(-50%);
    }

    .one-circle {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #ea580c;
      border: 2px solid #c2410c;
      display: inline-block;
      margin: 0 1px;
    }

    .input-row {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }

    .input-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .input-label {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 2px;
      color: #000;
    }

    .input-field {
      width: 30px;
      height: 30px;
      border: 2px solid #000;
      border-radius: 4px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      background: white;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Drucken / Als PDF speichern</button>

${(() => {
    let pagesHTML = '';
    for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
      const startIdx = pageIdx * exercisesPerPage;
      const endIdx = startIdx + exercisesPerPage;
      const pageExercises = exercises.slice(startIdx, endIdx);

      pagesHTML += '<div class="page"><div class="exercises-list">';

      for (let i = 0; i < pageExercises.length; i++) {
        const ex = pageExercises[i];
        let visualHTML = '';

        if (numberRange === "0-100") {
          // Show bundles for tens
          for (let t = 0; t < ex.tens; t++) {
            visualHTML += '<div class="ten-bundle">';
            for (let s = 0; s < 10; s++) {
              visualHTML += '<div class="stick"></div>';
            }
            visualHTML += '<div class="band"></div></div>';
          }
          // Show circles for ones
          for (let o = 0; o < ex.ones; o++) {
            visualHTML += '<div class="one-circle"></div>';
          }
        } else {
          // Show all as circles for 0-20
          for (let c = 0; c < ex.total; c++) {
            visualHTML += '<div class="one-circle"></div>';
          }
        }

        pagesHTML += `
          <div class="exercise">
            <div class="exercise-number">Aufgabe ${startIdx + i + 1}:</div>
            <div class="visual-container">
              ${visualHTML}
            </div>
            <div class="input-row">
              <div class="input-box">
                <div class="input-label">Z</div>
                <div class="input-field"></div>
              </div>
              <div class="input-box">
                <div class="input-label">E</div>
                <div class="input-field"></div>
              </div>
            </div>
          </div>
        `;
      }

      pagesHTML += '</div></div>';
    }
    return pagesHTML;
  })()}
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setStatusEmoji("🖨️");
    setStatusText("Übungsblatt geöffnet!");
  }

  function checkAnswer() {
    const zValue = Number(zInput);
    const eValue = Number(eInput);

    if (zInput === "" || eInput === "") {
      setStatusEmoji("🤔");
      setStatusText("Bitte fülle beide Felder aus!");
      return;
    }

    if (zValue === tens && eValue === ones) {
      setStatusEmoji("🎉");
      setStatusText("SUPER! Das ist richtig! 🌈");
      setCelebrate(true);
      setSolvedCount((x) => x + 1);
      if (checksThisPuzzle === 0) {
        setFirstTryCount((x) => x + 1);
      }
      setTimeout(() => {
        setCelebrate(false);
        newPuzzle();
      }, 2000);
    } else {
      setStatusEmoji("😕");
      setStatusText("Hmm… schau nochmal genau hin!");
      setChecksThisPuzzle((x) => x + 1);
    }
  }

  useEffect(() => {
    newPuzzle();
  }, []);

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
              {Array.from({ length: 100 }).map((_, i) => {
                const shapes = ['rounded-full', 'rounded-sm', 'rounded-lg'];
                const sizes = ['w-4 h-4', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7'];
                const angle = (i * 360) / 20;
                const burst = { x: 50, y: 30 };
                const velocity = 200 + Math.random() * 150;

                return (
                  <div
                    key={i}
                    className={`absolute ${shapes[Math.floor(Math.random() * shapes.length)]} ${sizes[Math.floor(Math.random() * sizes.length)]}`}
                    style={{
                      left: `${burst.x}%`,
                      top: `${burst.y}%`,
                      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                      animation: `firework-${i} ${2 + Math.random() * 0.8}s ease-out forwards`,
                    }}
                  >
                    <style>{`
                      @keyframes firework-${i} {
                        0% {
                          transform: translate(0, 0) scale(0.1);
                          opacity: 1;
                        }
                        100% {
                          transform: translate(${Math.cos(angle * Math.PI / 180) * velocity}px, ${Math.sin(angle * Math.PI / 180) * velocity + 150}px) scale(0.8);
                          opacity: 0;
                        }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-4xl sm:text-5xl">🔟</div>
              <div className="flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  ZEHNER UND EINER
                </div>
                <div className="text-xs sm:text-sm text-gray-700">
                  {statusEmoji} {statusText}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="rounded-2xl bg-white/70 border px-4 py-2">
                <div className="text-xs font-bold text-gray-600">Gelöst</div>
                <div className="text-2xl font-extrabold text-gray-900">{solvedCount}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button
                onClick={newPuzzle}
                className="px-4 py-3 rounded-2xl bg-emerald-500 text-white font-extrabold shadow-md border border-emerald-600 flex items-center justify-center"
              >
                <span className="text-xl sm:text-2xl">🎲</span>
                <span className="ml-2 text-sm sm:text-base">Neue Aufgabe</span>
              </button>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="rounded-3xl bg-white/70 border p-6 md:p-8">
              {/* Visual representation */}
              <div className="flex justify-center items-end gap-4 mb-8 flex-wrap">
                {numberRange === "0-100" ? (
                  <>
                    {/* Tens groups - bundles of vertical sticks (only for 0-100) */}
                    {Array.from({ length: tens }).map((_, i) => (
                      <div key={i} className="relative">
                        {/* Bundle of 10 vertical lines */}
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} className="w-1 h-20 bg-orange-600 rounded-sm" />
                          ))}
                        </div>
                        {/* Binding band around the bundle */}
                        <div className="absolute top-1/2 left-0 right-0 h-2 bg-red-600 -translate-y-1/2" />
                      </div>
                    ))}

                    {/* Ones - individual small circles */}
                    {Array.from({ length: ones }).map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-orange-600" />
                    ))}
                  </>
                ) : (
                  <>
                    {/* For 0-20: Show all as individual circles (no bundling) */}
                    {Array.from({ length: tens * 10 + ones }).map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-orange-600" />
                    ))}
                  </>
                )}
              </div>

              {/* Input fields in grid layout like worksheet */}
              <div className="max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Z field */}
                  <div>
                    <label className="block text-center mb-2">
                      <span className="text-lg font-extrabold text-gray-700">Z</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={zInput}
                      onChange={(e) => setZInput(cleanNumericInput(e.target.value))}
                      className="w-full h-20 text-center text-4xl font-extrabold outline-none bg-white border-2 border-gray-300 rounded-xl"
                      placeholder=""
                      aria-label="Zehner"
                    />
                  </div>

                  {/* E field */}
                  <div>
                    <label className="block text-center mb-2">
                      <span className="text-lg font-extrabold text-gray-700">E</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={eInput}
                      onChange={(e) => setEInput(cleanNumericInput(e.target.value))}
                      className="w-full h-20 text-center text-4xl font-extrabold outline-none bg-white border-2 border-gray-300 rounded-xl"
                      placeholder=""
                      aria-label="Einer"
                    />
                  </div>
                </div>

                <button
                  onClick={checkAnswer}
                  className="w-full mt-6 px-4 py-3 rounded-2xl bg-purple-500 text-white font-extrabold shadow-md border border-purple-600 flex items-center justify-center hover:bg-purple-600 transition-colors"
                >
                  <span className="text-xl sm:text-2xl">✓</span>
                  <span className="ml-2 text-sm sm:text-base">Prüfen</span>
                </button>
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

                  {/* Stats Display */}
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
                      <div className="text-sm font-extrabold mb-2">🔢 {labels.numberRange}</div>
                      <select
                        value={numberRange}
                        onChange={(e) => setNumberRange(e.target.value)}
                        className="w-full bg-white/70 rounded-xl border px-3 py-2 text-lg font-extrabold outline-none"
                      >
                        <option value="0-20">0 - 20</option>
                        <option value="0-100">0 - 100</option>
                      </select>
                    </label>

                    <label className="block rounded-2xl bg-white/70 border p-4">
                      <div className="text-sm font-extrabold mb-2">📄 {labels.printPagesLabel}</div>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={printPages}
                        onChange={(e) => setPrintPages(Number(e.target.value))}
                        className="w-full bg-white/70 rounded-xl border px-3 py-2 text-lg font-extrabold outline-none"
                      />
                    </label>

                    <div className="pt-4 space-y-3">
                      <button
                        onClick={() => {
                          generatePrintableWorksheet();
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-emerald-500 text-white border border-emerald-600 shadow-sm font-extrabold hover:bg-emerald-600 transition-colors flex items-center justify-center"
                        title={labels.printWorksheet}
                      >
                        <span className="text-2xl">🖨️</span>
                        <span className="ml-2">{labels.printWorksheet}</span>
                      </button>
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
