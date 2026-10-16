import { useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Users,
  Settings,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Undo2,
  Share2,
  Download,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAppStore } from "../../store/useAppStore";
import UkasSetupModal from "./UkasSetupModal";
import UkasGroupItem from "./UkasGroupItem";
import UkasOverview from "./UkasOverview";
import { UkasExportModal, UkasImportModal } from "./UkasShareModals";
import UkasTimeline from "./UkasTimeline";
import Select from "../../components/Select";
import {
  getCurrentWeekNumber,
  getCurrentYear,
  chunkStudentsIntoGroups,
  HOLIDAY_PRESETS,
  parseWeekInput,
} from "../../lib/ukasUtils";

export default function UkasArena() {
  const ukasPlans = useAppStore((s) => s.ukasPlans);
  const ukasPlanUndo = useAppStore((s) => s.ukasPlanUndo);
  const createUkasPlan = useAppStore((s) => s.createUkasPlan);
  const importUkasPlan = useAppStore((s) => s.importUkasPlan);
  const updateUkasPlan = useAppStore((s) => s.updateUkasPlan);
  const deleteUkasPlan = useAppStore((s) => s.deleteUkasPlan);
  const setUkasGroups = useAppStore((s) => s.setUkasGroups);
  const markUkasGroupStatus = useAppStore((s) => s.markUkasGroupStatus);
  const shiftUkasPlanSchedule = useAppStore((s) => s.shiftUkasPlanSchedule);
  const shiftBackUkasPlanSchedule = useAppStore(
    (s) => s.shiftBackUkasPlanSchedule
  );
  const undoUkasPlanShift = useAppStore((s) => s.undoUkasPlanShift);
  const shuffleUkasPlanGroups = useAppStore((s) => s.shuffleUkasPlanGroups);
  const reorderUkasPlanGroups = useAppStore((s) => s.reorderUkasPlanGroups);
  const toggleUkasBlockedWeek = useAppStore((s) => s.toggleUkasBlockedWeek);
  const autoGenerateUkasGroupsFromClass = useAppStore(
    (s) => s.autoGenerateUkasGroupsFromClass
  );

  const classes = useAppStore((s) => s.classes);
  const activeClassId = useAppStore((s) => s.activeClassId);
  const activeClass = classes[activeClassId] || { name: "", students: [] };

  const planIds = Object.keys(ukasPlans);
  const [viewMode, setViewMode] = useState("overview"); // "overview" | "detail"
  const [selectedPlanId, setSelectedPlanId] = useState(planIds[0] || null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [exportPlanModal, setExportPlanModal] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showBlockedWeeksPanel, setShowBlockedWeeksPanel] = useState(false);
  const [customWeekInput, setCustomWeekInput] = useState("");

  // Active plan object
  const currentPlan = ukasPlans[selectedPlanId] || ukasPlans[planIds[0]] || null;

  function handleAddCustomWeeks() {
    if (!currentPlan) return;
    const parsed = parseWeekInput(customWeekInput);
    parsed.forEach((w) => {
      if (!currentPlan.blockedWeeks?.includes(w)) {
        toggleUkasBlockedWeek(currentPlan.id, w);
      }
    });
    setCustomWeekInput("");
  }

  const currentWeek = getCurrentWeekNumber();
  const currentYear = getCurrentYear();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Find the next active group ("Neste ut")
  const nextGroup = useMemo(() => {
    if (!currentPlan || !currentPlan.groups || currentPlan.groups.length === 0)
      return null;

    // First preference: non-completed group assigned to current week
    const currentWeekGroup = currentPlan.groups.find(
      (g) =>
        g.status !== "completed" &&
        g.assignedWeek === currentWeek &&
        (g.assignedYear === currentYear || !g.assignedYear)
    );
    if (currentWeekGroup) return currentWeekGroup;

    // Second preference: first non-completed group in chronological schedule
    return currentPlan.groups.find((g) => g.status !== "completed") || null;
  }, [currentPlan, currentWeek, currentYear]);

  // Statistics
  const stats = useMemo(() => {
    if (!currentPlan || !currentPlan.groups)
      return { total: 0, completed: 0, percentage: 0 };
    const total = currentPlan.groups.length;
    const completed = currentPlan.groups.filter(
      (g) => g.status === "completed"
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [currentPlan]);

  function handleCreatePresetPlan(presetTitle, presetGroupSize = 1) {
    const newId = createUkasPlan({
      title: presetTitle,
      subject: activeClass.name || "",
      classId: activeClassId,
      startWeek: currentWeek,
      startYear: currentYear,
      interval: 1,
      groupSize: presetGroupSize,
      blockedWeeks: [40, 51, 52, 8, 14],
      initialStudents: activeClass.students || [],
    });
    setSelectedPlanId(newId);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || !currentPlan || active.id === over.id) return;
    const oldIndex = currentPlan.groups.findIndex((g) => g.id === active.id);
    const newIndex = currentPlan.groups.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newGroups = arrayMove(currentPlan.groups, oldIndex, newIndex);
    reorderUkasPlanGroups(currentPlan.id, newGroups);
  }

  function handleMoveGroupUp(index) {
    if (!currentPlan || index <= 0) return;
    const newGroups = arrayMove(currentPlan.groups, index, index - 1);
    reorderUkasPlanGroups(currentPlan.id, newGroups);
  }

  function handleMoveGroupDown(index) {
    if (!currentPlan || index >= currentPlan.groups.length - 1) return;
    const newGroups = arrayMove(currentPlan.groups, index, index + 1);
    reorderUkasPlanGroups(currentPlan.id, newGroups);
  }

  function handleAddManualGroup() {
    if (!currentPlan) return;
    const newGroupNumber = currentPlan.groups.length + 1;
    const newGroup = {
      id: crypto.randomUUID(),
      name: `Gruppe ${newGroupNumber}`,
      students: [],
      assignedWeek: null,
      assignedYear: null,
      status: "planned",
    };
    setUkasGroups(currentPlan.id, [...currentPlan.groups, newGroup]);
  }

  function handleDeleteGroup(groupId) {
    if (!currentPlan) return;
    const filtered = currentPlan.groups.filter((g) => g.id !== groupId);
    setUkasGroups(currentPlan.id, filtered);
  }

  function handleUpdateGroup(groupId, partial) {
    if (!currentPlan) return;
    const updated = currentPlan.groups.map((g) =>
      g.id === groupId ? { ...g, ...partial } : g
    );
    setUkasGroups(currentPlan.id, updated);
  }

  if (viewMode === "overview" || !currentPlan) {
    return (
      <>
        <UkasOverview
          plans={ukasPlans}
          onSelectPlan={(id) => {
            setSelectedPlanId(id);
            setViewMode("detail");
          }}
          onCreatePlan={() => {
            setEditingPlan(null);
            setIsSetupModalOpen(true);
          }}
          onEditPlan={(plan) => {
            setEditingPlan(plan);
            setIsSetupModalOpen(true);
          }}
          onDeletePlan={(id) => {
            deleteUkasPlan(id);
          }}
          onExportPlan={(plan) => {
            setExportPlanModal(plan);
          }}
          onImportPlan={() => {
            setIsImportModalOpen(true);
          }}
        />

        <UkasSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => {
            setIsSetupModalOpen(false);
            setEditingPlan(null);
          }}
          initialPlan={editingPlan}
        />

        {exportPlanModal && (
          <UkasExportModal
            plan={exportPlanModal}
            onClose={() => setExportPlanModal(null)}
          />
        )}

        {isImportModalOpen && (
          <UkasImportModal
            onImport={(planData) => {
              const newId = importUkasPlan(planData);
              setSelectedPlanId(newId);
              setViewMode("detail");
            }}
            onClose={() => setIsImportModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* Top Header Bar - Clean aligned height and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setViewMode("overview")}
            className="flex h-10 items-center gap-2 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 font-heading text-sm font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-surface cursor-pointer shrink-0"
            title="Gå til oversikten over alle opplegg"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Oversikt
          </button>

          <div className="h-6 w-[2px] bg-ink/10 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-ink truncate">
              {currentPlan.title}
            </h1>
            {currentPlan.subject && (
              <span className="rounded-md bg-primary/10 px-2.5 py-0.5 font-heading text-xs font-semibold text-primary shrink-0">
                {currentPlan.subject}
              </span>
            )}
          </div>
        </div>

        {/* Plan selector & actions - aligned heights */}
        <div className="flex flex-wrap items-center gap-2">
          {planIds.length > 1 && (
            <Select
              value={currentPlan.id}
              onChange={(val) => {
                setSelectedPlanId(val);
                setViewMode("detail");
              }}
              ariaLabel="Velg Ukas-opplegg"
              options={planIds.map((id) => ({
                value: id,
                label: `${ukasPlans[id].title} (${ukasPlans[id].groups?.length || 0} gr.)`,
              }))}
              className="h-10 rounded-xl border-2 border-primary/20 bg-primary/10 px-3.5 font-heading text-sm font-semibold text-primary focus:outline-none cursor-pointer"
            />
          )}

          <button
            type="button"
            onClick={() => setExportPlanModal(currentPlan)}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 font-heading text-sm font-semibold text-ink hover:border-primary/40 transition-colors cursor-pointer"
            title="Eksporter dette opplegget"
          >
            <Share2 size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Eksporter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(currentPlan);
              setIsSetupModalOpen(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/10 bg-canvas text-ink hover:border-primary/40 transition-colors cursor-pointer"
            title="Innstillinger for valgt opplegg"
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Er du sikker på at du vil slette «${currentPlan.title}»?`
                )
              ) {
                deleteUkasPlan(currentPlan.id);
                setViewMode("overview");
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/10 bg-canvas text-ink/60 hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer"
            title="Slett dette opplegget"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setIsSetupModalOpen(true);
            }}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-primary bg-primary px-3.5 font-heading text-sm font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Nytt opplegg</span>
          </button>
        </div>
      </div>

      {/* No plans created state */}
      {!currentPlan && (
        <div className="flex flex-col items-center justify-center rounded-xl2 border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={32} />
          </div>
          <h2 className="font-heading text-xl font-bold text-ink">
            Ingen aktiviteter ennå
          </h2>
          <p className="mt-1 max-w-md font-body text-sm text-ink/70">
            Opprett en ny tidsplan for roterende elevaktiviteter som forskerframlegg, ukens aktuelt, eller ordenselever.
          </p>

          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setIsSetupModalOpen(true);
            }}
            className="mt-6 flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-6 py-3 font-heading font-semibold text-white shadow-clay hover:bg-primary-hover"
          >
            <Plus size={20} /> Opprett nytt Ukas-opplegg
          </button>

          {/* Quick preset templates */}
          <div className="mt-8 w-full max-w-xl">
            <span className="font-heading text-xs font-semibold uppercase tracking-wider text-ink/50 block mb-3">
              Eller start med en mal:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCreatePresetPlan("Forskerframlegg", 2)}
                className="flex flex-col items-center rounded-xl border-2 border-ink/10 bg-surface p-4 text-center transition-all hover:border-primary hover:shadow-md"
              >
                <span className="font-heading font-bold text-ink">🔬 Forskerframlegg</span>
                <span className="font-body text-xs text-ink/60 mt-1">2 elever per gruppe</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreatePresetPlan("Ukens aktuelt", 1)}
                className="flex flex-col items-center rounded-xl border-2 border-ink/10 bg-surface p-4 text-center transition-all hover:border-primary hover:shadow-md"
              >
                <span className="font-heading font-bold text-ink">📰 Ukens aktuelt</span>
                <span className="font-body text-xs text-ink/60 mt-1">1 elev per uke</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreatePresetPlan("Ordenselever", 2)}
                className="flex flex-col items-center rounded-xl border-2 border-ink/10 bg-surface p-4 text-center transition-all hover:border-primary hover:shadow-md"
              >
                <span className="font-heading font-bold text-ink">🧹 Ordenselever</span>
                <span className="font-body text-xs text-ink/60 mt-1">2 elever sammen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPlan && (
        <>
          {/* Main Dashboard Highlight Card ("NESTE UT") */}
          <div className="relative overflow-hidden rounded-xl2 border-2 border-primary bg-gradient-to-br from-primary/10 via-surface to-primary/5 p-6 shadow-clay">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Info section */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-white shadow-xs animate-pulse">
                    🌟 NESTE UT / DENNE UKEN
                  </span>
                  {nextGroup?.assignedWeek && (
                    <span className="font-heading text-xs font-semibold text-ink/70">
                      Uke {nextGroup.assignedWeek}
                    </span>
                  )}
                </div>

                {nextGroup ? (
                  <div>
                    <h2 className="font-heading text-2xl font-extrabold text-ink">
                      {nextGroup.name}
                    </h2>
                    {nextGroup.students && nextGroup.students.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {nextGroup.students.map((student, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-surface border-2 border-primary/30 px-3 py-1 font-heading text-base font-bold text-primary shadow-xs"
                          >
                            {student}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-sm text-ink/60 italic pt-1">
                        Ingen elever lagt til i denne gruppen ennå.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="font-heading text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={24} /> Alle grupper er gjennomført!
                    </h2>
                    <p className="font-body text-sm text-ink/70 pt-1">
                      Flott jobba! Du kan nullstille statusene for å starte runden på nytt, eller legge til flere grupper.
                    </p>
                  </div>
                )}
              </div>

              {/* One-click action buttons */}
              {nextGroup && (
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => markUkasGroupStatus(currentPlan.id, nextGroup.id, "completed")}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-5 py-3 font-heading font-bold text-white shadow-clay hover:bg-emerald-700 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={20} /> Markér som gjennomført
                  </button>

                  <button
                    type="button"
                    onClick={() => shiftUkasPlanSchedule(currentPlan.id, nextGroup.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-amber-600 bg-amber-400 px-5 py-3 font-heading font-extrabold text-amber-950 dark:bg-amber-600 dark:text-white shadow-clay hover:bg-amber-500 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowRight size={18} /> Utsatt – skyv resten 1 uke
                  </button>

                  {ukasPlanUndo[currentPlan?.id] && (
                    <button
                      type="button"
                      onClick={() => undoUkasPlanShift(currentPlan.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 px-4 py-2 font-heading text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                    >
                      <RotateCcw size={16} /> Angre siste forskyving
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar footer */}
            <div className="mt-6 border-t border-ink/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-heading text-sm text-ink/70">
                <Clock size={16} />
                <span>
                  Fremdrift: <strong>{stats.completed}</strong> av <strong>{stats.total}</strong> grupper fullført ({stats.percentage}%)
                </span>
              </div>
              <div className="h-3 w-full sm:w-48 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border-2 border-ink/10 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => shuffleUkasPlanGroups(currentPlan.id)}
                className="flex items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 py-2 font-heading text-xs font-semibold text-ink hover:border-primary/40 hover:bg-primary/5 transition-colors"
                title="Randomiser rekkefølgen på gruppene"
              >
                <Shuffle size={16} /> Stokk rekkefølge
              </button>

              <button
                type="button"
                onClick={() => shiftUkasPlanSchedule(currentPlan.id)}
                className="flex items-center gap-1.5 rounded-xl border-2 border-amber-600 bg-amber-400 px-3.5 py-2 font-heading text-xs font-extrabold text-amber-950 dark:bg-amber-600 dark:text-white shadow-xs hover:bg-amber-500 transition-colors cursor-pointer"
                title="Forskyv alle ugjennomførte grupper 1 uke fram"
              >
                <ArrowRight size={16} /> Skyv 1 uke fram
              </button>

              <button
                type="button"
                onClick={() => shiftBackUkasPlanSchedule(currentPlan.id)}
                className="flex items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 py-2 font-heading text-xs font-semibold text-ink hover:border-primary/40 hover:bg-primary/5 transition-colors"
                title="Trekk alle ugjennomførte grupper 1 uke tilbake"
              >
                <RotateCcw size={16} /> Trekk 1 uke tilbake
              </button>

              {ukasPlanUndo[currentPlan?.id] && (
                <button
                  type="button"
                  onClick={() => undoUkasPlanShift(currentPlan.id)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-primary/40 bg-primary/10 px-3.5 py-2 font-heading text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  title="Angre forskyvingen"
                >
                  <RotateCcw size={16} /> Angre forskyving
                </button>
              )}

              {activeClass.students.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    autoGenerateUkasGroupsFromClass(
                      currentPlan.id,
                      activeClassId,
                      currentPlan.groupSize || 1
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 py-2 font-heading text-xs font-semibold text-ink hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  title={`Opprett nye grupper fra ${activeClass.name}`}
                >
                  <Users size={16} /> Hent fra {activeClass.name}
                </button>
              )}

              <UkasTimeline
                currentPlan={currentPlan}
                toggleUkasBlockedWeek={toggleUkasBlockedWeek}
                showBlockedWeeksPanel={showBlockedWeeksPanel}
                setShowBlockedWeeksPanel={setShowBlockedWeeksPanel}
              />
            </div>

            <button
              type="button"
              onClick={handleAddManualGroup}
              className="flex items-center gap-1 rounded-xl border-2 border-primary/40 bg-primary/10 px-3.5 py-2 font-heading text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus size={16} /> Legg til gruppe
            </button>
          </div>

          {/* Interactive Group Schedule List */}
          {currentPlan.groups && currentPlan.groups.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-heading text-base font-bold text-ink">
                  Tidsplan og grupperekkefølge ({currentPlan.groups.length} grupper)
                </h3>
                <span className="font-body text-xs text-ink/60">
                  Dra radene for å endre rekkefølge (ukenumre rekalkuleres)
                </span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentPlan.groups.map((g) => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {currentPlan.groups.map((group, index) => {
                      const isNext = nextGroup?.id === group.id;
                      return (
                        <UkasGroupItem
                          key={group.id}
                          group={group}
                          index={index}
                          totalCount={currentPlan.groups.length}
                          isCurrentWeek={isNext}
                          onMarkCompleted={(gid) =>
                            markUkasGroupStatus(currentPlan.id, gid, "completed")
                          }
                          onMarkPlanned={(gid) =>
                            markUkasGroupStatus(currentPlan.id, gid, "planned")
                          }
                          onShiftRest={(gid) =>
                            shiftUkasPlanSchedule(currentPlan.id, gid)
                          }
                          onUpdateGroup={handleUpdateGroup}
                          onDeleteGroup={handleDeleteGroup}
                          onMoveUp={handleMoveGroupUp}
                          onMoveDown={handleMoveGroupDown}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="rounded-xl2 border-2 border-dashed border-ink/10 bg-surface p-8 text-center">
              <p className="font-heading font-semibold text-ink/70">
                Ingen grupper er lagt til i dette opplegget ennå.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {activeClass.students.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      autoGenerateUkasGroupsFromClass(
                        currentPlan.id,
                        activeClassId,
                        currentPlan.groupSize || 1
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-4 py-2 font-heading font-semibold text-white shadow-xs hover:bg-primary-hover"
                  >
                    <Users size={18} /> Generer fra {activeClass.name}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddManualGroup}
                  className="flex items-center gap-2 rounded-xl border-2 border-ink/10 bg-canvas px-4 py-2 font-heading font-semibold text-ink hover:border-primary/40"
                >
                  <Plus size={18} /> Legg til gruppe manuelt
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Setup / Edit Modal */}
      <UkasSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false);
          setEditingPlan(null);
        }}
        initialPlan={editingPlan}
      />

      {exportPlanModal && (
        <UkasExportModal
          plan={exportPlanModal}
          onClose={() => setExportPlanModal(null)}
        />
      )}

      {isImportModalOpen && (
        <UkasImportModal
          onImport={(planData) => {
            const newId = importUkasPlan(planData);
            setSelectedPlanId(newId);
            setViewMode("detail");
          }}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
}
