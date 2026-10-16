import { useState } from "react";
import { StickyNote, Presentation, Sparkles } from "lucide-react";
import MineNotaterView from "./MineNotaterView";
import KlassetavleView from "./KlassetavleView";

export default function NotaterArena() {
  const [activeTab, setActiveTab] = useState("mine"); // "mine" | "tavle"

  return (
    <div className="space-y-6">
      {/* Module Top Header & Tab Toggle Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <StickyNote size={24} />
            <h1 className="font-heading text-2xl font-bold text-ink">Notater</h1>
          </div>
          <p className="font-body text-xs text-ink-muted">
            Personlige sticky notes og interaktiv klassetavle for undervisning
          </p>
        </div>

        {/* Tab Selector Toggle */}
        <div className="flex items-center gap-1.5 rounded-full border-2 border-border-subtle bg-surface p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 font-heading text-xs font-bold transition-all duration-150 active:scale-95 ${
              activeTab === "mine"
                ? "bg-primary text-white shadow-sm"
                : "text-ink-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <StickyNote size={16} />
            Mine notater
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tavle")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 font-heading text-xs font-bold transition-all duration-150 active:scale-95 ${
              activeTab === "tavle"
                ? "bg-primary text-white shadow-sm"
                : "text-ink-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Presentation size={16} />
            Klassetavle
          </button>
        </div>
      </div>

      {/* Tab Content Views */}
      <div className="animate-fade-slide-up">
        {activeTab === "mine" ? <MineNotaterView /> : <KlassetavleView />}
      </div>
    </div>
  );
}
