import { CalendarDays, Plus, Download, Share2, Settings, Trash2, ArrowRight, Users, CheckCircle2, Clock } from "lucide-react";

export default function UkasOverview({
  plans,
  onSelectPlan,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onExportPlan,
  onImportPlan,
}) {
  const planList = Object.values(plans || {});

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-6 sm:p-8 shadow-clay">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-xs">
            <CalendarDays size={32} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-ink">
              Ukas.. — opplegg og tidsplaner
            </h1>
            <p className="font-body text-sm sm:text-base text-ink/70 mt-1">
              Administrer roterende elevoppgaver, ordenselever, presentasjoner og ukas nyheter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onImportPlan}
            className="flex min-h-touch items-center gap-2 rounded-xl border-2 border-ink/10 bg-canvas px-4 py-2.5 font-heading text-sm font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-surface cursor-pointer"
          >
            <Download size={18} aria-hidden="true" />
            Importer
          </button>

          <button
            type="button"
            onClick={onCreatePlan}
            className="flex min-h-touch items-center gap-2 rounded-xl border-2 border-primary bg-primary px-5 py-2.5 font-heading text-sm font-semibold text-white shadow-xs transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer"
          >
            <Plus size={20} aria-hidden="true" />
            Nytt opplegg
          </button>
        </div>
      </div>

      {/* Grid of Plans */}
      {planList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl2 border-2 border-dashed border-ink/20 bg-surface/50 p-12 text-center shadow-xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays size={32} aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-bold text-ink">Ingen Ukas-opplegg enda</h2>
          <p className="mt-1 max-w-md font-body text-sm text-ink/60">
            Opprett et nytt opplegg eller importer en delingskode for å komme i gang med roterende elevoppgaver.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onImportPlan}
              className="flex items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-5 py-3 font-heading font-semibold text-ink transition-colors hover:border-primary/40"
            >
              <Download size={18} aria-hidden="true" />
              Importer opplegg
            </button>
            <button
              type="button"
              onClick={onCreatePlan}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading font-semibold text-white shadow-xs hover:bg-primary-hover"
            >
              <Plus size={20} aria-hidden="true" />
              Opprett nytt opplegg
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {planList.map((plan) => {
            const groups = plan.groups || [];
            const completedCount = groups.filter((g) => g.status === "completed").length;
            const progressPercent = groups.length > 0 ? Math.round((completedCount / groups.length) * 100) : 0;
            const nextGroup = groups.find((g) => g.status !== "completed");

            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay transition-all hover:border-primary/30"
              >
                <div>
                  {/* Card Title & Subject Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-heading text-xl font-bold text-ink">{plan.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {plan.subject && (
                          <span className="rounded-md bg-primary/10 px-2.5 py-0.5 font-heading text-xs font-semibold text-primary">
                            {plan.subject}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-body text-xs font-medium text-ink/60">
                          <Users size={14} aria-hidden="true" />
                          {groups.length} {groups.length === 1 ? "gruppe" : "grupper"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress info */}
                  <div className="my-4 space-y-2">
                    <div className="flex justify-between font-body text-xs text-ink/70">
                      <span>Fremdrift ({completedCount}/{groups.length})</span>
                      <span className="font-semibold text-primary">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next up preview */}
                  {nextGroup && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-canvas p-3 font-body text-xs text-ink/80">
                      <Clock size={16} className="text-primary shrink-0" aria-hidden="true" />
                      <span>
                        Neste ut: <strong>{nextGroup.name}</strong>
                        {nextGroup.assignedWeek && ` (Uke ${nextGroup.assignedWeek})`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-ink/10 pt-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onExportPlan(plan)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-canvas text-ink/70 transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
                      title="Eksporter opplegg"
                    >
                      <Share2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditPlan(plan)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-canvas text-ink/70 transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
                      title="Rediger opplegg"
                    >
                      <Settings size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePlan(plan.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-canvas text-ink/70 transition-colors hover:border-destructive/40 hover:text-destructive cursor-pointer"
                      title="Slett opplegg"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-heading text-sm font-semibold text-white shadow-xs transition-all hover:bg-primary-hover active:scale-[0.97] cursor-pointer"
                  >
                    Åpne
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
