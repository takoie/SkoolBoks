import { useState } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import BombSettings from "./BombSettings";
import BombGame from "./BombGame";

function BombArena() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-ink">Send bomben</h2>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          {showSettings ? (
            <>
              <ArrowLeft size={18} aria-hidden="true" />
              Tilbake til spillet
            </>
          ) : (
            <>
              <Settings size={18} aria-hidden="true" />
              Innstillinger
            </>
          )}
        </button>
      </div>

      {showSettings ? <BombSettings /> : <BombGame />}
    </div>
  );
}

export default BombArena;
