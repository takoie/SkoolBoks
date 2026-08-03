import { useState } from "react";
import { Info, Plus, RefreshCw, Save, Trash2, Upload, Users, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import Select from "../../components/Select";
import CollapsibleSection from "../../components/CollapsibleSection";

const WORD_LANGUAGES = [
  { value: "bokmal", label: "Bokmål" },
  { value: "nynorsk", label: "Nynorsk" },
  { value: "engelsk", label: "Engelsk" },
];

function BombSettings() {
  const bomb = useAppStore((s) => s.bomb);
  const classes = useAppStore((s) => s.classes);
  const setBombSettings = useAppStore((s) => s.setBombSettings);
  const importBombParticipantsFromClass = useAppStore(
    (s) => s.importBombParticipantsFromClass
  );
  const addBombParticipant = useAppStore((s) => s.addBombParticipant);
  const removeBombParticipant = useAppStore((s) => s.removeBombParticipant);
  const addBombWord = useAppStore((s) => s.addBombWord);
  const removeBombWord = useAppStore((s) => s.removeBombWord);
  const clearBombWordBank = useAppStore((s) => s.clearBombWordBank);
  const importRandomWordPack = useAppStore((s) => s.importRandomWordPack);
  const saveBombWordList = useAppStore((s) => s.saveBombWordList);
  const loadBombWordList = useAppStore((s) => s.loadBombWordList);
  const deleteBombWordList = useAppStore((s) => s.deleteBombWordList);

  const [selectedClassId, setSelectedClassId] = useState(
    Object.keys(classes)[0] ?? ""
  );
  const [nameDraft, setNameDraft] = useState("");
  const [wordDraft, setWordDraft] = useState("");
  const [wordFilter, setWordFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [listNameDraft, setListNameDraft] = useState("");
  const [selectedListId, setSelectedListId] = useState("");

  const filteredWords = bomb.wordBank.filter((w) =>
    w.toLowerCase().includes(wordFilter.toLowerCase())
  );

  async function handleImportRandomWordPack() {
    setImporting(true);
    try {
      await importRandomWordPack();
    } finally {
      setImporting(false);
    }
  }

  function handleSaveWordList(e) {
    e.preventDefault();
    saveBombWordList(listNameDraft);
    setListNameDraft("");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CollapsibleSection title="Tidsintervall">
        <div className="flex items-center gap-4">
          <label className="flex flex-col gap-1 font-body text-base text-ink">
            Min. sekunder
            <input
              type="number"
              min={5}
              max={bomb.maxSeconds}
              value={bomb.minSeconds}
              onChange={(e) =>
                setBombSettings({ minSeconds: Number(e.target.value) })
              }
              className="min-h-touch w-28 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-base text-ink">
            Maks. sekunder
            <input
              type="number"
              min={bomb.minSeconds}
              max={600}
              value={bomb.maxSeconds}
              onChange={(e) =>
                setBombSettings({ maxSeconds: Number(e.target.value) })
              }
              className="min-h-touch w-28 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Modus">
        <div className="flex gap-4 font-body text-base text-ink">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={bomb.mode === "names"}
              onChange={() => setBombSettings({ mode: "names" })}
              className="h-5 w-5 accent-primary"
            />
            Navneliste
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={bomb.mode === "anonymous"}
              onChange={() => setBombSettings({ mode: "anonymous" })}
              className="h-5 w-5 accent-primary"
            />
            Anonym
          </label>
        </div>
      </CollapsibleSection>

      {bomb.mode === "names" && (
        <CollapsibleSection title="Deltakere">
          <div className="mb-3 flex gap-2">
            <Select
              value={selectedClassId}
              onChange={setSelectedClassId}
              ariaLabel="Velg klasse å importere fra"
              options={Object.entries(classes).map(([id, c]) => ({
                value: id,
                label: `${c.name} · ${c.students.length}`,
              }))}
              className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
            />
            <button
              type="button"
              onClick={() => importBombParticipantsFromClass(selectedClassId)}
              disabled={!classes[selectedClassId]?.students.length}
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Users size={18} aria-hidden="true" />
              Importer fra klasse
            </button>
          </div>

          <div className="mb-3 flex flex-col gap-2">
            {bomb.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="flex-1 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-body text-base text-ink">
                  {p.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeBombParticipant(p.id)}
                  aria-label={`Fjern ${p.name}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addBombParticipant(nameDraft);
              setNameDraft("");
            }}
          >
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Legg til navn"
              className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
            />
            <button
              type="submit"
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              <Plus size={18} aria-hidden="true" />
              Legg til
            </button>
          </form>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Lagrede ordlister">
        <p className="mb-3 font-body text-sm text-ink/60">
          Lagre gjeldende ordbank som en egen liste — nyttig for å bytte
          mellom f.eks. en liste for barneskolen og en for VGS.
        </p>

        {bomb.savedWordLists.length > 0 && (
          <div className="mb-3 flex gap-2">
            <Select
              value={selectedListId}
              onChange={setSelectedListId}
              ariaLabel="Velg lagret ordliste"
              options={bomb.savedWordLists.map((l) => ({
                value: l.id,
                label: `${l.name} · ${l.words.length} ord`,
              }))}
              className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
            />
            <button
              type="button"
              onClick={() => loadBombWordList(selectedListId)}
              disabled={!selectedListId}
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload size={18} aria-hidden="true" />
              Last inn
            </button>
            <button
              type="button"
              onClick={() => {
                deleteBombWordList(selectedListId);
                setSelectedListId("");
              }}
              disabled={!selectedListId}
              aria-label="Slett valgt ordliste"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        <form className="flex gap-2" onSubmit={handleSaveWordList}>
          <input
            type="text"
            value={listNameDraft}
            onChange={(e) => setListNameDraft(e.target.value)}
            placeholder="Navn på ny liste (f.eks. Barneskole)"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
          />
          <button
            type="submit"
            disabled={!listNameDraft.trim() || bomb.wordBank.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={18} aria-hidden="true" />
            Lagre gjeldende ordbank
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Ordbank">
        <div className="mb-4 flex items-start gap-3 rounded-xl2 border-2 border-destructive/30 bg-destructive/5 p-3">
          <Info size={20} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <p className="font-body text-sm text-ink/80">
              Tilfeldig import henter ord fra store, ufiltrerte ordlister. Vi
              filtrerer som standard bort en liste med kjente uønskede ord,
              men listen er ikke uttømmende — <strong>sjekk ordbanken før
              bruk</strong>.
            </p>
            <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink">
              <input
                type="checkbox"
                checked={bomb.allowMatureWords}
                onChange={(e) =>
                  setBombSettings({ allowMatureWords: e.target.checked })
                }
                className="h-5 w-5 accent-destructive"
              />
              Tillat uønskede ord ved import (f.eks. for VGS)
            </label>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 font-body text-base text-ink">
            Språk
            <Select
              value={bomb.wordImportLanguage}
              onChange={(value) => setBombSettings({ wordImportLanguage: value })}
              ariaLabel="Velg språk for ordimport"
              options={WORD_LANGUAGES}
              className="min-h-touch w-40 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-base text-ink">
            Min. lengde
            <input
              type="number"
              min={2}
              max={bomb.wordMaxLength}
              value={bomb.wordMinLength}
              onChange={(e) =>
                setBombSettings({ wordMinLength: Number(e.target.value) })
              }
              className="min-h-touch w-24 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-base text-ink">
            Maks. lengde
            <input
              type="number"
              min={bomb.wordMinLength}
              max={20}
              value={bomb.wordMaxLength}
              onChange={(e) =>
                setBombSettings({ wordMaxLength: Number(e.target.value) })
              }
              className="min-h-touch w-24 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={handleImportRandomWordPack}
            disabled={importing}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={18} aria-hidden="true" />
            {importing ? "Importerer…" : "Importer tilfeldig ordpakke"}
          </button>
          <button
            type="button"
            onClick={clearBombWordBank}
            disabled={bomb.wordBank.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={18} aria-hidden="true" />
            Fjern alle ord
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            value={wordFilter}
            onChange={(e) => setWordFilter(e.target.value)}
            placeholder="Søk i ord"
            className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
          />
        </div>

        <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {filteredWords.map((word) => (
            <div key={word} className="flex items-center gap-2">
              <span className="flex-1 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-body text-base text-ink">
                {word}
              </span>
              <button
                type="button"
                onClick={() => removeBombWord(word)}
                aria-label={`Fjern ${word}`}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </div>
          ))}
          {bomb.wordBank.length === 0 && (
            <p className="font-body text-base text-ink/60">
              Ordbanken er tom — importer en tilfeldig ordpakke for å komme i gang.
            </p>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addBombWord(wordDraft);
            setWordDraft("");
          }}
        >
          <input
            type="text"
            value={wordDraft}
            onChange={(e) => setWordDraft(e.target.value)}
            placeholder="Legg til eget ord"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
          />
          <button
            type="submit"
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Plus size={18} aria-hidden="true" />
            Legg til
          </button>
        </form>
      </CollapsibleSection>
    </div>
  );
}

export default BombSettings;
