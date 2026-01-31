import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Hamburger Button - Top Left */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 p-2 sm:px-3 sm:py-3 rounded-xl sm:rounded-2xl bg-white border shadow-lg hover:shadow-xl transition-all flex items-center"
        title="Navigation"
        aria-label="Navigation"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Navigation Menu Overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-full max-w-xs bg-gradient-to-br from-sky-50 via-pink-50 to-emerald-50 shadow-2xl z-50 overflow-y-auto animate-slide-in-left">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">📚</span>
                  Übungen
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

              <nav className="space-y-3">
                <Link
                  to="/zahlenpyramide"
                  onClick={() => setMenuOpen(false)}
                  className={`block w-full px-4 py-4 rounded-2xl font-extrabold shadow-sm transition-all flex items-center gap-3 ${
                    location.pathname === "/zahlenpyramide" || location.pathname === "/"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-white/70 border hover:bg-white"
                  }`}
                >
                  <span className="text-3xl">🧱</span>
                  <span>Zahlenpyramide</span>
                </Link>

                <Link
                  to="/zehner"
                  onClick={() => setMenuOpen(false)}
                  className={`block w-full px-4 py-4 rounded-2xl font-extrabold shadow-sm transition-all flex items-center gap-3 ${
                    location.pathname === "/zehner"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-white/70 border hover:bg-white"
                  }`}
                >
                  <span className="text-3xl">🔟</span>
                  <span>Zehner und Einer</span>
                </Link>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
