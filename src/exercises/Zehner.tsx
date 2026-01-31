import { useEffect, useState } from "react";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cleanNumericInput(next: string) {
  const cleaned = String(next).replace(/[^0-9]/g, "");
  return cleaned.slice(0, 1);
}

export default function Zehner() {
  const [tens, setTens] = useState<number>(0);
  const [ones, setOnes] = useState<number>(0);
  const [zInput, setZInput] = useState<string>("");
  const [eInput, setEInput] = useState<string>("");
  const [statusEmoji, setStatusEmoji] = useState<string>("🧠");
  const [statusText, setStatusText] = useState<string>("Zähle die Zehner (Z) und Einer (E)!");
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [solvedCount, setSolvedCount] = useState<number>(0);

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

  function newPuzzle() {
    const newTens = randInt(1, 9);
    const newOnes = randInt(0, 9);
    setTens(newTens);
    setOnes(newOnes);
    setZInput("");
    setEInput("");
    setStatusEmoji("🧠");
    setStatusText("Zähle die Zehner (Z) und Einer (E)!");
    setCelebrate(false);
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

  const totalNumber = tens * 10 + ones;

  return (
    <>
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
            <div className="rounded-3xl bg-white/70 border p-4 md:p-6">
              <div className="text-center mb-4">
                <div className="text-sm font-bold text-gray-600 mb-2">Zahl:</div>
                <div className="text-6xl font-extrabold text-gray-900">{totalNumber}</div>
              </div>

              {/* Visual representation */}
              <div className="flex flex-col items-center gap-6 mb-6">
                {/* Tens groups */}
                {tens > 0 && (
                  <div>
                    <div className="text-sm font-bold text-gray-600 mb-2 text-center">Zehner:</div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {Array.from({ length: tens }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="grid grid-cols-2 gap-1 p-2 rounded-lg bg-blue-100 border-2 border-blue-400">
                            {Array.from({ length: 10 }).map((_, j) => (
                              <div key={j} className="w-3 h-3 rounded-full bg-blue-500" />
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
                    <div className="text-sm font-bold text-gray-600 mb-2 text-center">Einer:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Array.from({ length: ones }).map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-amber-500 border-2 border-amber-600" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input fields */}
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center gap-3 bg-white rounded-2xl border-2 border-blue-400 p-4">
                    <span className="text-2xl font-extrabold text-blue-600">Z</span>
                    <span className="text-sm font-bold text-gray-600">=</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={zInput}
                      onChange={(e) => setZInput(cleanNumericInput(e.target.value))}
                      className="flex-1 text-center text-3xl font-extrabold outline-none bg-transparent"
                      placeholder="?"
                      aria-label="Zehner"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center gap-3 bg-white rounded-2xl border-2 border-amber-400 p-4">
                    <span className="text-2xl font-extrabold text-amber-600">E</span>
                    <span className="text-sm font-bold text-gray-600">=</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={eInput}
                      onChange={(e) => setEInput(cleanNumericInput(e.target.value))}
                      className="flex-1 text-center text-3xl font-extrabold outline-none bg-transparent"
                      placeholder="?"
                      aria-label="Einer"
                    />
                  </label>
                </div>

                <button
                  onClick={checkAnswer}
                  className="w-full px-4 py-3 rounded-2xl bg-purple-500 text-white font-extrabold shadow-md border border-purple-600 flex items-center justify-center"
                >
                  <span className="text-xl sm:text-2xl">✓</span>
                  <span className="ml-2 text-sm sm:text-base">Prüfen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
