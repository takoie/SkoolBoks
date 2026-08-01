import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { parseSlots, WORD_TYPES } from "../../lib/adjectiveStory";

const LABEL_BY_TYPE = Object.fromEntries(WORD_TYPES.map((w) => [w.type, w.label]));

function CollectView({ story, onBack, onComplete }) {
  const slots = parseSlots(story.text);
  const [slotIndex, setSlotIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");

  const slot = slots[slotIndex];
  const isLast = slotIndex >= slots.length - 1;

  function handleConfirm(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const nextAnswers = { ...answers, [slot.index]: trimmed };
    if (isLast) {
      onComplete(nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setValue("");
    setSlotIndex((i) => i + 1);
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
      <button
        type="button"
        onClick={onBack}
        aria-label="Tilbake til redigering"
        className="absolute left-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
      >
        <ArrowLeft size={22} aria-hidden="true" />
      </button>

      <p className="font-heading text-xl font-semibold text-ink/50">
        {slotIndex + 1} av {slots.length}
      </p>

      <h2 className="font-heading text-6xl font-bold text-primary">
        {LABEL_BY_TYPE[slot.type]}
      </h2>

      <form onSubmit={handleConfirm} className="flex w-full flex-col items-center gap-4">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl2 border-4 border-ink/10 bg-surface px-6 py-5 text-center font-body text-3xl text-ink outline-none transition-colors focus:border-primary/40"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "Fullfør" : "Neste →"}
        </button>
      </form>
    </div>
  );
}

export default CollectView;
