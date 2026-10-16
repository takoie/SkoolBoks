import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import ModuleCard from "../../components/ModuleCard";

export default function DashboardDrawer({
  cat,
  index,
  totalCategories,
  isCollapsed,
  isEditingThisCat,
  editingName,
  setEditingName,
  setEditingCategoryId,
  onToggleCollapse,
  onRenameSubmit,
  onMoveCategory,
  onDeleteCategory,
  isEditMode,
  setActiveModule,
  hideModule,
  moveModuleToCategory,
  categoryOptions,
}) {
  return (
    <div
      id={`cat-container-${cat.id}`}
      className="rounded-xl2 border border-ink/10 bg-surface/30 p-4 transition-all hover:border-ink/20 shadow-sm"
    >
      {/* Category Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleCollapse(cat.id)}
            className="flex cursor-pointer items-center gap-2 text-left font-heading text-xl font-bold text-ink transition-colors hover:text-primary"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronDown size={22} className="text-ink/60" />
            ) : (
              <ChevronUp size={22} className="text-ink/60" />
            )}
          </button>

          {isEditingThisCat ? (
            <form
              onSubmit={(e) => onRenameSubmit(cat.id, e)}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="rounded-lg border-2 border-primary bg-surface px-3 py-1 font-heading text-lg font-bold text-ink focus:outline-none"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-primary px-3 py-1 font-heading text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Lagre
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold text-ink">
                {cat.name}
              </span>
              <span className="rounded-full bg-ink/10 px-2.5 py-0.5 font-body text-xs font-semibold text-ink/70">
                {cat.modules.length}
              </span>
            </div>
          )}
        </div>

        {/* Actions in Edit Mode */}
        {isEditMode && (
          <div className="flex items-center gap-1.5">
            {!isEditingThisCat && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(cat.id);
                  setEditingName(cat.name);
                }}
                aria-label={`Endre navn på ${cat.name}`}
                title="Endre navn"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-surface text-ink/70 shadow-sm transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Pencil size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onMoveCategory(index, index - 1)}
              disabled={index === 0}
              aria-label={`Flytt ${cat.name} opp`}
              title="Flytt opp"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-surface text-ink/70 shadow-sm transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp size={16} />
            </button>

            <button
              type="button"
              onClick={() => onMoveCategory(index, index + 1)}
              disabled={index === totalCategories - 1}
              aria-label={`Flytt ${cat.name} ned`}
              title="Flytt ned"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-surface text-ink/70 shadow-sm transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown size={16} />
            </button>

            {totalCategories > 1 && (
              <button
                type="button"
                onClick={() => onDeleteCategory(cat.id)}
                aria-label={`Slett kategori ${cat.name}`}
                title="Slett kategori"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-white"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modules Grid */}
      {!isCollapsed && (
        <SortableContext
          items={cat.modules.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          {cat.modules.length === 0 ? (
            <div className="flex min-h-[120px] w-full items-center justify-center rounded-xl border-2 border-dashed border-ink/15 p-6 text-center text-ink/50">
              <span className="font-body text-base">
                Ingen moduler i denne kategorien. Dra moduler hit eller velg kategorien på en modul.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {cat.modules.map((m) => (
                <ModuleCard
                  key={m.id}
                  id={m.id}
                  icon={m.icon}
                  image={m.image}
                  title={m.title}
                  description={m.description}
                  accent={m.accent}
                  onClick={() => setActiveModule(m.id)}
                  isEditMode={isEditMode}
                  onRemove={() => hideModule(m.id)}
                  categories={categoryOptions}
                  currentCategoryId={cat.id}
                  onMoveToCategory={(targetCatId) =>
                    moveModuleToCategory(m.id, targetCatId)
                  }
                />
              ))}
            </div>
          )}
        </SortableContext>
      )}
    </div>
  );
}
