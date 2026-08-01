import { useRef } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { WORD_TYPES, parseSlots, insertMarker } from "../../lib/adjectiveStory";

function StoryEditor({ storyId, onBack, onCollect }) {
  const story = useAppStore((s) => s.adjectiveStories[storyId]);
  const updateAdjectiveStory = useAppStore((s) => s.updateAdjectiveStory);
  const textareaRef = useRef(null);

  if (!story) return null;

  const slots = parseSlots(story.text);
  const canCollect = slots.length > 0;
  const counts = WORD_TYPES.map(({ type, label }) => ({
    label,
    count: slots.filter((s) => s.type === type).length,
  })).filter((c) => c.count > 0);

  function handleInsert(type) {
    const el = textareaRef.current;
    const cursorPos = el ? el.selectionStart : story.text.length;
    const { text, cursorPos: newPos } = insertMarker(story.text, cursorPos, type);
    updateAdjectiveStory(storyId, { text });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til historie-listen"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <input
          value={story.title}
          onChange={(e) => updateAdjectiveStory(storyId, { title: e.target.value })}
          className="min-w-0 flex-1 rounded-xl2 border-2 border-transparent bg-transparent px-2 py-1 font-heading text-2xl font-semibold text-ink outline-none transition-colors focus:border-primary/40 focus:bg-surface"
        />
        <button
          type="button"
          onClick={onCollect}
          disabled={!canCollect}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={20} aria-hidden="true" />
          Start innsamling
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {WORD_TYPES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleInsert(type)}
            className="cursor-pointer rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            + {label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={story.text}
        onChange={(e) => updateAdjectiveStory(storyId, { text: e.target.value })}
        rows={14}
        placeholder="Skriv eller lim inn historien her, og bruk knappene over for å sette inn ord-plassholdere der ordklassen skal mangle."
        className="w-full rounded-xl2 border-2 border-ink/10 bg-surface p-4 font-body text-lg leading-relaxed text-ink outline-none transition-colors focus:border-primary/40"
      />

      <p className="mt-3 text-base text-ink/60">
        {slots.length === 0
          ? "Ingen plassholdere satt inn ennå."
          : `${slots.length} ord å fylle inn: ${counts
              .map((c) => `${c.count} ${c.label.toLowerCase()}`)
              .join(", ")}.`}
      </p>
    </div>
  );
}

export default StoryEditor;
