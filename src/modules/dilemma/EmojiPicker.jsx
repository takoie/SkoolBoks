import { useState, useRef, useEffect } from "react";
import { Smile, X, Search } from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    name: "Piler og hender",
    emojis: ["👈", "👉", "👍", "👎", "🤝", "🙌", "👋", "✌️", "🤞", "👊", "🧠", "💡", "❓", "❗", "⚖️"],
  },
  {
    name: "Aktivitet og ting",
    emojis: ["🚀", "🏰", "⚽", "🎮", "📚", "✏️", "🎨", "🎵", "🏆", "🚗", "🚆", "🤖", "🛡️", "♻️", "🛍️", "🎯", "🎲", "🧩"],
  },
  {
    name: "Mat og drikke",
    emojis: ["🍕", "🌮", "🍔", "🍟", "🍦", "🍎", "🍣", "🍫", "🍩", "🥤", "🍿", "🍉", "🍓", "🥨"],
  },
  {
    name: "Dyr og natur",
    emojis: ["🦅", "🐶", "🐱", "🦁", "🦊", "🐻", "🦄", "🌲", "☀️", "❄️", "🌊", "🔥", "🌈", "⭐", "🍀"],
  },
  {
    name: "Ansikter og humør",
    emojis: ["😊", "😎", "🤔", "🥷", "🥳", "😴", "😍", "😱", "🤩", "😇", "🤠", "🧐", "😈", "🤖"],
  },
];

export function EmojiPickerPopover({ currentEmoji, onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((cat) => cat.emojis).filter((e) => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (customEmoji.trim()) {
      onSelect(customEmoji.trim());
      onClose();
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-40 mt-2 w-72 rounded-2xl border-2 border-ink/10 bg-surface p-3 shadow-clay animate-modal-in"
    >
      <div className="flex items-center justify-between border-b border-ink/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5 font-heading text-sm font-bold text-ink">
          <Smile size={16} className="text-primary" />
          <span>Velg ikon / emoji</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick Category Buttons */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none mb-2">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => {
              setActiveCategory(idx);
              setSearch("");
            }}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-heading text-xs font-bold transition-colors ${
              activeCategory === idx && !search
                ? "bg-primary text-white shadow-xs"
                : "bg-ink/10 text-ink hover:bg-ink/20"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emojis Grid */}
      <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto p-1 border rounded-xl border-ink/10 bg-background/50">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-primary/20 ${
              currentEmoji === emoji ? "bg-primary/20 ring-2 ring-primary" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Custom Emoji / Clear */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/10 pt-2">
        <form onSubmit={handleCustomSubmit} className="flex flex-1 gap-1">
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="Egen emoji..."
            className="w-full rounded-lg border border-ink/20 bg-surface px-2.5 py-1 text-xs font-medium text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-2.5 py-1 font-heading text-xs font-bold text-white hover:bg-primary-hover shadow-xs"
          >
            Bruk
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            onSelect("");
            onClose();
          }}
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-heading text-xs font-bold text-destructive hover:bg-destructive/20 whitespace-nowrap"
        >
          Fjern
        </button>
      </div>
    </div>
  );
}
