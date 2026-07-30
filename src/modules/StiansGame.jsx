import { useState } from "react";
import { Plus, Trash2, Check, Play } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function SetupPhase() {
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const categoryBank = useAppStore((s) => s.categoryBank);
  const addStiansGroup = useAppStore((s) => s.addStiansGroup);
  const removeStiansGroup = useAppStore((s) => s.removeStiansGroup);
  const addCategoryToBank = useAppStore((s) => s.addCategoryToBank);
  const removeCategoryFromBank = useAppStore((s) => s.removeCategoryFromBank);
  const setStiansCategories = useAppStore((s) => s.setStiansCategories);
  const startStiansGame = useAppStore((s) => s.startStiansGame);

  const [groupDraft, setGroupDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");

  function handleAddGroup() {
    const name = groupDraft.trim();
    if (!name) return;
    addStiansGroup(name);
    setGroupDraft("");
  }

  function handleAddCategory() {
    const name = categoryDraft.trim();
    if (!name) return;
    addCategoryToBank(name);
    if (!categories.includes(name)) {
      setStiansCategories([...categories, name]);
    }
    setCategoryDraft("");
  }

  function toggleCategory(name) {
    setStiansCategories(
      categories.includes(name)
        ? categories.filter((c) => c !== name)
        : [...categories, name]
    );
  }

  const canStart = groups.length >= 2 && categories.length >= 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Stians game — oppsett
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Sett opp lag og velg kategorier før dere starter.
      </p>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Lag ({groups.length})
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={groupDraft}
            onChange={(e) => setGroupDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            placeholder="Lagnavn"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til lag
          </button>
        </div>
        <ul className="flex flex-wrap gap-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-2 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink shadow-clay"
            >
              {g.name}
              <button
                type="button"
                onClick={() => removeStiansGroup(g.id)}
                aria-label={`Fjern ${g.name}`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Kategoribank
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Ny kategori (f.eks. Bilmerker)"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til i banken
          </button>
        </div>
        <p className="mb-2 text-base text-ink/60">
          Huk av kategoriene som skal brukes i dagens spill ({categories.length} valgt):
        </p>
        <ul className="flex flex-wrap gap-3">
          {categoryBank.map((name) => {
            const active = categories.includes(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggleCategory(name)}
                  aria-pressed={active}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-body text-lg transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-ink/10 bg-surface text-ink hover:bg-ink/5"
                  }`}
                >
                  {active && <Check size={18} aria-hidden="true" />}
                  {name}
                </button>
              </li>
            );
          })}
          {categoryBank.length === 0 && (
            <li className="text-base text-ink/60">
              Kategoribanken er tom — legg til en kategori over.
            </li>
          )}
        </ul>
        {categoryBank.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-body text-base text-ink/60">
              Slett kategorier fra banken
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {categoryBank.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => removeCategoryFromBank(name)}
                    className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1 font-body text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <button
        type="button"
        onClick={startStiansGame}
        disabled={!canStart}
        className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={24} aria-hidden="true" />
        Start spill
      </button>
      {!canStart && (
        <p className="mt-2 text-base text-ink/60">
          Trenger minst 2 lag og 1 kategori for å starte.
        </p>
      )}
    </div>
  );
}

function StiansGame() {
  const phase = useAppStore((s) => s.stiansGame.phase);

  if (phase === "setup") return <SetupPhase />;

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-lg text-ink/70">
        Fase "{phase}" bygges i neste steg.
      </p>
    </div>
  );
}

export default StiansGame;
