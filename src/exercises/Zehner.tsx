import { useEffect, useMemo, useState } from "react";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cleanNumericInput(next: string) {
  const cleaned = String(next).replace(/[^0-9]/g, "");
  return cleaned.slice(0, 1);
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
    return "10-99";
  });

  const [tens, setTens] = useState<number>(0);
  const [ones, setOnes] = useState<number>(0);
  const [zInput, setZInput] = useState<string>("");
  const [eInput, setEInput] = useState<string>("");
  const [statusEmoji, setStatusEmoji] = useState<string>("🧠");
  const [statusText, setStatusText] = useState<string>("Zähle die Zehner (Z) und Einer (E)!");
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zehner_stats_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { solved?: number };
      if (typeof parsed.solved === "number") setSolvedCount(parsed.solved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("zehner_stats_v1", JSON.stringify({ solved: solvedCount }));
    } catch {
      // ignore
    }
  }, [solvedCount]);

  useEffect(() => {
    try {
      localStorage.setItem("zehner_preferences_v1", JSON.stringify({ numberRange }));
    } catch {
      // ignore
    }
  }, [numberRange]);

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
      reset: "Zurücksetzen",
      numberRange: "Zahlenbereich",
    }),
    []
  );

  function getRange(range: string): { minTens: number; maxTens: number; minOnes: number; maxOnes: number } {
    switch (range) {
      case "10-50":
        return { minTens: 1, maxTens: 5, minOnes: 0, maxOnes: 9 };
      case "10-99":
        return { minTens: 1, maxTens: 9, minOnes: 0, maxOnes: 9 };
      case "20-99":
        return { minTens: 2, maxTens: 9, minOnes: 0, maxOnes: 9 };
      default:
        return { minTens: 1, maxTens: 9, minOnes: 0, maxOnes: 9 };
    }
  }

  function newPuzzle() {
    const range = getRange(numberRange);
    const newTens = randInt(range.minTens, range.maxTens);
    const newOnes = randInt(range.minOnes, range.maxOnes);
    setTens(newTens);
    setOnes(newOnes);
    setZInput("");
    setEInput("");
    setStatusEmoji("🧠");
    setStatusText("Zähle die Zehner (Z) und Einer (E)!");
    setCelebrate(false);
  }

  function resetStats() {
    setSolvedCount(0);
    setStatusEmoji("🧼");
    setStatusText("Punkte zurückgesetzt!");
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
      setTimeout(() => {
        setCelebrate(false);
        newPuzzle();
      }, 2000);
    } else {
      setStatusEmoji("😕");
      setStatusText("Hmm… schau nochmal genau hin!");
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
              <div className="flex flex-col items-center gap-6 mb-8">
                {/* Tens groups */}
                {tens > 0 && (
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-3 text-center">Zehner:</div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {Array.from({ length: tens }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="grid grid-cols-2 gap-1 p-2 rounded-lg bg-blue-100 border-2 border-blue-400">
                            {Array.from({ length: 10 }).map((_, j) => (
                              <div key={j} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ones */}
                {ones > 0 && (
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-3 text-center">Einer:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Array.from({ length: ones }).map((_, i) => (
                        <div key={i} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 border-2 border-amber-600" />
                      ))}
                    </div>
                  </div>
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
                  <div className="mb-6">
                    <div className="rounded-2xl bg-white/70 border p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="text-3xl">🧩</div>
                        <div>
                          <div className="text-xs font-bold text-gray-600">{labels.solved}</div>
                          <div className="text-2xl font-extrabold text-gray-900">{solvedCount}</div>
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
                        <option value="10-50">10 - 50</option>
                        <option value="10-99">10 - 99</option>
                        <option value="20-99">20 - 99</option>
                      </select>
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
