import { useRef, useState } from "react";
import { List, Plus, Trash2, Upload } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import Select from "../../components/Select";
import { parseWheelString } from "../../lib/wheelSpin";

function SectorEditor({ sectors, onChange, disabled = false }) {
  const lists = useAppStore((s) => s.classes);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [listImportOpen, setListImportOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");
  const inputRefs = useRef({});

  function updateLabel(id, label) {
    onChange(sectors.map((s) => (s.id === id ? { ...s, label } : s)));
  }

  function addRow(afterId) {
    const newSector = { id: crypto.randomUUID(), label: "" };
    if (!afterId) {
      onChange([...sectors, newSector]);
    } else {
      const idx = sectors.findIndex((s) => s.id === afterId);
      const next = [...sectors];
      next.splice(idx + 1, 0, newSector);
      onChange(next);
    }
    requestAnimationFrame(() => inputRefs.current[newSector.id]?.focus());
  }

  function removeRow(id) {
    onChange(sectors.filter((s) => s.id !== id));
  }

  function handleKeyDown(e, id) {
    if (e.key === "Enter") {
      e.preventDefault();
      addRow(id);
    }
  }

  function applyImport() {
    const parsed = parseWheelString(importText);
    if (parsed && parsed.sectors.length > 0) {
      onChange(parsed.sectors.map((label) => ({ id: crypto.randomUUID(), label })));
    } else {
      const labels = importText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (labels.length > 0) {
        onChange(labels.map((label) => ({ id: crypto.randomUUID(), label })));
      }
    }
    setImportText("");
    setImportOpen(false);
  }

  function openListImport() {
    setImportOpen(false);
    setSelectedListId((current) => current || Object.keys(lists)[0] || "");
    setListImportOpen((v) => !v);
  }

  function applyListImport() {
    const names = lists[selectedListId]?.students ?? [];
    if (names.length > 0) {
      onChange(names.map((label) => ({ id: crypto.randomUUID(), label })));
    }
    setListImportOpen(false);
  }

  return (
    <fieldset disabled={disabled}>
      <div className="mb-3 flex flex-col gap-2">
        {sectors.map((sector) => (
          <div key={sector.id} className="flex items-center gap-2">
            <input
              ref={(el) => (inputRefs.current[sector.id] = el)}
              type="text"
              value={sector.label}
              onChange={(e) => updateLabel(sector.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, sector.id)}
              placeholder="Sektortekst"
              className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-base text-ink"
            />
            <button
              type="button"
              onClick={() => removeRow(sector.id)}
              aria-label="Fjern sektor"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={20} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addRow(null)}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Plus size={18} aria-hidden="true" />
          Legg til sektor
        </button>
        <button
          type="button"
          onClick={() => {
            setListImportOpen(false);
            setImportOpen((v) => !v);
          }}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Upload size={18} aria-hidden="true" />
          Importer fra tekst
        </button>
        <button
          type="button"
          onClick={openListImport}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <List size={18} aria-hidden="true" />
          Importer fra liste
        </button>
      </div>

      {importOpen && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"Én sektor per linje"}
            rows={6}
            className="w-full rounded-xl2 border-2 border-ink/10 bg-surface p-3 font-body text-base text-ink"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyImport}
              className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Erstatt sektorer
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {listImportOpen && (
        <div className="mt-3 flex flex-col gap-2">
          {Object.keys(lists).length === 0 ? (
            <p className="font-body text-base text-ink/60">Ingen lister tilgjengelig.</p>
          ) : (
            <Select
              value={selectedListId}
              onChange={setSelectedListId}
              ariaLabel="Velg navneliste"
              options={Object.entries(lists).map(([id, list]) => ({
                value: id,
                label: `${list.name} · ${list.students.length}`,
              }))}
              className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-base text-ink"
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyListImport}
              disabled={!lists[selectedListId]?.students.length}
              className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Erstatt sektorer
            </button>
            <button
              type="button"
              onClick={() => setListImportOpen(false)}
              className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

export default SectorEditor;
