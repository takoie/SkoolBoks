import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Share2,
  Save,
  HelpCircle,
  Pencil,
  Smile,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { createEmptyDilemma } from "../../lib/dilemmaTypes";
import { DilemmaExportModal } from "./DilemmaShareModals";
import { EmojiPickerPopover } from "./EmojiPicker";
import { DilemmaImagePicker } from "./DilemmaImagePicker";

function SessionEditor({ sessionId, onBack, onPresent }) {
  const session = useAppStore((s) => s.dilemmaSessions[sessionId]);
  const updateDilemmaSession = useAppStore((s) => s.updateDilemmaSession);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null); // { idx, side }

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <p className="text-xl text-ink/70">Fant ikke økten.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-primary px-4 py-2 font-heading font-semibold text-white"
        >
          Tilbake til oversikten
        </button>
      </div>
    );
  }

  function handleTitleChange(title) {
    updateDilemmaSession(session.id, { title });
  }

  function handleDescriptionChange(description) {
    updateDilemmaSession(session.id, { description });
  }

  function handleDilemmaChange(index, field, value) {
    const nextDilemmas = [...session.dilemmas];
    nextDilemmas[index] = {
      ...nextDilemmas[index],
      [field]: value,
    };
    updateDilemmaSession(session.id, { dilemmas: nextDilemmas });
  }

  function handleOptionChange(dilemmaIndex, side, field, value) {
    const nextDilemmas = [...session.dilemmas];
    const current = nextDilemmas[dilemmaIndex];
    const sideKey = side === "left" ? "leftOption" : "rightOption";

    nextDilemmas[dilemmaIndex] = {
      ...current,
      [sideKey]: {
        ...current[sideKey],
        [field]: value,
      },
    };
    updateDilemmaSession(session.id, { dilemmas: nextDilemmas });
  }

  function handleAddDilemma() {
    const newDilemma = createEmptyDilemma(session.dilemmas.length + 1);
    updateDilemmaSession(session.id, {
      dilemmas: [...session.dilemmas, newDilemma],
    });
  }

  function handleDeleteDilemma(index) {
    if (session.dilemmas.length <= 1) {
      alert("Økten må ha minst ett dilemma.");
      return;
    }
    const nextDilemmas = session.dilemmas.filter((_, i) => i !== index);
    updateDilemmaSession(session.id, { dilemmas: nextDilemmas });
  }

  function handleMoveDilemma(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= session.dilemmas.length) return;

    const nextDilemmas = [...session.dilemmas];
    const temp = nextDilemmas[index];
    nextDilemmas[index] = nextDilemmas[targetIndex];
    nextDilemmas[targetIndex] = temp;

    updateDilemmaSession(session.id, { dilemmas: nextDilemmas });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-4 shadow-clay">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Oversikt
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Share2 size={18} aria-hidden="true" />
            Del og eksporter
          </button>

          <button
            type="button"
            onClick={onPresent}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
          >
            <Play size={18} aria-hidden="true" />
            Kjør økt (presentasjon)
          </button>
        </div>
      </div>

      {/* Session Metadata Card */}
      <div className="rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay space-y-4">
        <div>
          <label className="mb-1 block font-heading text-sm font-semibold text-ink/70">
            Tittel på økt
          </label>
          <input
            type="text"
            value={session.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="f.eks. Ville du helst...?"
            className="w-full rounded-xl border-2 border-ink/10 bg-background/50 p-3 font-heading text-xl font-bold text-ink focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-heading text-sm font-semibold text-ink/70">
            Beskrivelse (valgfritt)
          </label>
          <input
            type="text"
            value={session.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="f.eks. Oppstartsaktivitet for 6. klasse"
            className="w-full rounded-xl border-2 border-ink/10 bg-background/50 p-3 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Dilemmas List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-2xl font-semibold text-ink">
            Dilemmaer ({session.dilemmas.length})
          </h3>
          <button
            type="button"
            onClick={handleAddDilemma}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 font-heading text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Plus size={18} aria-hidden="true" />
            Legg til dilemma
          </button>
        </div>

        {session.dilemmas.map((dilemma, idx) => (
          <div
            key={dilemma.id}
            className="relative rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay space-y-4"
          >
            {/* Header & Controls */}
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
              <span className="font-heading font-bold text-primary">
                Dilemma #{idx + 1}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveDilemma(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Flytt opp"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDilemma(idx, 1)}
                  disabled={idx === session.dilemmas.length - 1}
                  aria-label="Flytt ned"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDilemma(idx)}
                  aria-label="Slett dilemma"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Title / Question */}
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-ink/60 uppercase tracking-wider">
                Tema / spørsmål
              </label>
              <input
                type="text"
                value={dilemma.title}
                onChange={(e) => handleDilemmaChange(idx, "title", e.target.value)}
                placeholder="f.eks. Superkrefter, Hverdagsvalg, eller Ville du helst..."
                className="w-full rounded-xl border-2 border-ink/10 bg-background/50 p-2.5 font-heading text-lg font-semibold text-ink focus:border-primary focus:outline-none"
              />
            </div>

            {/* Left vs Right Options Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Option Card */}
              <div className="rounded-xl border-2 border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-heading font-bold text-sm">
                  <span>👈 Venstre side (alternativ A)</span>
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs text-ink/60">
                    Tekst / påstand
                  </label>
                  <textarea
                    rows={2}
                    value={dilemma.leftOption.text}
                    onChange={(e) =>
                      handleOptionChange(idx, "left", "text", e.target.value)
                    }
                    placeholder="Beskriv venstre alternativ..."
                    className="w-full resize-none rounded-xl border-2 border-ink/10 bg-surface p-2.5 text-sm text-ink focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="mb-1 block font-heading text-xs text-ink/60">
                    Ikon / emoji (valgfritt)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={dilemma.leftOption.icon}
                      onChange={(e) =>
                        handleOptionChange(idx, "left", "icon", e.target.value)
                      }
                      placeholder="🦅, 🍕..."
                      className="w-24 rounded-xl border-2 border-ink/10 bg-surface p-2 text-center text-lg focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEmojiPicker(
                          activeEmojiPicker?.idx === idx && activeEmojiPicker?.side === "left"
                            ? null
                            : { idx, side: "left" }
                        )
                      }
                      className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-cyan-600/40 bg-cyan-100 dark:bg-cyan-950/60 px-3.5 font-heading text-xs font-bold text-cyan-950 dark:text-cyan-100 hover:bg-cyan-200 dark:hover:bg-cyan-900 transition-colors shadow-sm"
                    >
                      <Smile size={16} />
                      <span>Velg emoji</span>
                    </button>
                  </div>

                  {activeEmojiPicker?.idx === idx && activeEmojiPicker?.side === "left" && (
                    <EmojiPickerPopover
                      currentEmoji={dilemma.leftOption.icon}
                      onSelect={(emoji) => handleOptionChange(idx, "left", "icon", emoji)}
                      onClose={() => setActiveEmojiPicker(null)}
                    />
                  )}
                </div>

                <DilemmaImagePicker
                  imagePath={dilemma.leftOption.imagePath}
                  onImageChange={(path) =>
                    handleOptionChange(idx, "left", "imagePath", path)
                  }
                  accentColor="cyan"
                />
              </div>

              {/* Right Option Card */}
              <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-heading font-bold text-sm">
                  <span>Høyre side (alternativ B) 👉</span>
                </div>

                <div>
                  <label className="mb-1 block font-heading text-xs text-ink/60">
                    Tekst / påstand
                  </label>
                  <textarea
                    rows={2}
                    value={dilemma.rightOption.text}
                    onChange={(e) =>
                      handleOptionChange(idx, "right", "text", e.target.value)
                    }
                    placeholder="Beskriv høyre alternativ..."
                    className="w-full resize-none rounded-xl border-2 border-ink/10 bg-surface p-2.5 text-sm text-ink focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label className="mb-1 block font-heading text-xs text-ink/60">
                    Ikon / emoji (valgfritt)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={dilemma.rightOption.icon}
                      onChange={(e) =>
                        handleOptionChange(idx, "right", "icon", e.target.value)
                      }
                      placeholder="🥷, 🌮..."
                      className="w-24 rounded-xl border-2 border-ink/10 bg-surface p-2 text-center text-lg focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEmojiPicker(
                          activeEmojiPicker?.idx === idx && activeEmojiPicker?.side === "right"
                            ? null
                            : { idx, side: "right" }
                        )
                      }
                      className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-amber-600/40 bg-amber-100 dark:bg-amber-950/60 px-3.5 font-heading text-xs font-bold text-amber-950 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-sm"
                    >
                      <Smile size={16} />
                      <span>Velg emoji</span>
                    </button>
                  </div>

                  {activeEmojiPicker?.idx === idx && activeEmojiPicker?.side === "right" && (
                    <EmojiPickerPopover
                      currentEmoji={dilemma.rightOption.icon}
                      onSelect={(emoji) => handleOptionChange(idx, "right", "icon", emoji)}
                      onClose={() => setActiveEmojiPicker(null)}
                    />
                  )}
                </div>

                <DilemmaImagePicker
                  imagePath={dilemma.rightOption.imagePath}
                  onImageChange={(path) =>
                    handleOptionChange(idx, "right", "imagePath", path)
                  }
                  accentColor="amber"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Dilemma Bottom Button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleAddDilemma}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary/10 px-6 py-3 font-heading font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Plus size={20} aria-hidden="true" />
          Legg til enda et dilemma
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <DilemmaExportModal
          session={session}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default SessionEditor;
