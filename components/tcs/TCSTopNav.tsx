"use client";

export default function TCSTopNav() {
  return (
    <header className="w-full border-b border-cyan-500/40 bg-black/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-300 shadow-lg shadow-cyan-500/40" />
          <div>
            <div className="text-sm font-semibold tracking-[0.2em] text-cyan-300 uppercase">
              TC-S Network
            </div>
            <div className="text-xs text-cyan-100/70">
              Solar Waves · Live Energy Economy
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-cyan-100/80">
          <span className="hidden sm:inline">SI: live from Solar Dashboard</span>
          <span className="hidden sm:inline">Reserve: live from Solar Reserve</span>
        </div>
      </div>
    </header>
  );
}
