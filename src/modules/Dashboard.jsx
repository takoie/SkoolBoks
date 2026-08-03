import {
  Dices,
  Trophy,
  Timer as TimerIcon,
  Hash,
  Dice5,
  Puzzle,
  CircleDot,
  Grid3x3,
  Drama,
  Bomb,
  Skull,
  Feather,
  Sigma,
  Pencil,
  Check,
  Volume2,
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useAppStore } from "../store/useAppStore";
import ModuleCard from "../components/ModuleCard";
import ModuleDrawer from "../components/ModuleDrawer";
import stianIcon from "../img/stian.png";

// Distinct icon-background hues, cycled in order below so every module gets
// a different color from its neighbors. Add a new hue here (and to
// ModuleCard's accentClasses + the theme colors in index.css) once this list
// is exhausted, rather than reusing one that's already assigned.
const ACCENT_ORDER = [
  "primary",
  "secondary",
  "lime",
  "peach",
  "coral",
  "teal",
  "sky",
  "violet",
  "fuchsia",
  "gold",
  "green",
];

const MODULES = [
  {
    id: "spinwheel",
    icon: Dices,
    title: "Elevtrekker",
    description: "Trekk et tilfeldig navn fra navnelisten.",
  },
  {
    id: "quizarena",
    icon: Trophy,
    title: "Jeopardy",
    description: "Lag og spill quiz — kategorier og poeng.",
  },
  {
    id: "timer",
    icon: TimerIcon,
    title: "Nedtelling",
    description: "Visuell timer med alarm.",
  },
  {
    id: "nearestthousand",
    icon: Hash,
    title: "Nærmest tusen",
    description: "Trekk 9 siffer og kom nærmest 1000.",
  },
  {
    id: "dice",
    icon: Dice5,
    title: "Terningkast",
    description: "Kast en eller flere terninger.",
  },
  {
    id: "stiansgame",
    icon: Puzzle,
    image: stianIcon,
    title: "Stians game",
    description: "Bokstav, kategorier og poeng — lagspill i runder.",
    accent: "secondary",
  },
  {
    id: "wheel",
    icon: CircleDot,
    title: "Hjul",
    description: "Lag og spinn egne hjul med valgfrie sektorer.",
  },
  {
    id: "gjette",
    icon: Grid3x3,
    title: "GjettE",
    description: "Gjett dagens ord — bokmål, nynorsk eller engelsk.",
  },
  {
    id: "tofakta",
    icon: Drama,
    title: "2+1 fake",
    description: "To sanne påstander og én løgn — la klassen gjette.",
  },
  {
    id: "bomb",
    icon: Bomb,
    title: "Send bomben",
    description: "Nedtelling, ord og en bombe som går av.",
  },
  {
    id: "hangman",
    icon: Skull,
    title: "Hangman",
    description: "Klassisk hangman — tilfeldig ord eller gamehost-modus.",
  },
  {
    id: "adjektivfortelling",
    icon: Feather,
    title: "Ordklassefortelling",
    description: "Fyll inn adjektiv, substantiv og verb — les historien sammen etterpå.",
  },
  {
    id: "gangemester",
    icon: Sigma,
    title: "Gangemester",
    description: "Øv på gangetabellen mot klokka — streak og poeng.",
  },
  {
    id: "noisemeter",
    icon: Volume2,
    title: "Støymeter",
    description: "Lag-konkurranse i å lage mest mulig lyd — nedtelling og resultattavle.",
  },
];

// Modules with an explicit `accent` (or an `image`, like Stians game) keep
// their fixed color; everything else is assigned the next unused hue from
// ACCENT_ORDER in declaration order, so newly added modules automatically
// get a color no earlier module is using.
let nextAccentIndex = 0;
for (const m of MODULES) {
  if (!m.accent && !m.image) {
    m.accent = ACCENT_ORDER[nextAccentIndex % ACCENT_ORDER.length];
    nextAccentIndex += 1;
  }
}

const MODULES_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

// Splits the static MODULES list into visible/hidden module objects using
// the persisted order/hidden id lists. Ids missing from both (a module
// added after this state was last saved) default to visible, appended at
// the end; ids that no longer match a real module (one that was removed
// from the codebase) are dropped.
function resolveModules(dashboard) {
  const knownIds = new Set([...dashboard.order, ...dashboard.hidden]);
  const newIds = MODULES.filter((m) => !knownIds.has(m.id)).map((m) => m.id);

  const visible = [...dashboard.order, ...newIds]
    .map((id) => MODULES_BY_ID[id])
    .filter(Boolean);
  const hidden = dashboard.hidden.map((id) => MODULES_BY_ID[id]).filter(Boolean);

  return { visible, hidden };
}

function Dashboard() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "", students: [] }
  );
  const dashboard = useAppStore((s) => s.dashboard);
  const isEditMode = useAppStore((s) => s.isEditMode);
  const toggleEditMode = useAppStore((s) => s.toggleEditMode);
  const hideModule = useAppStore((s) => s.hideModule);
  const showModule = useAppStore((s) => s.showModule);
  const reorderModules = useAppStore((s) => s.reorderModules);

  const { visible, hidden } = resolveModules(dashboard);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((m) => m.id === active.id);
    const newIndex = visible.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderModules(arrayMove(visible, oldIndex, newIndex).map((m) => m.id));
  }

  return (
    <div className="w-full">
      {activeClass.students.length === 0 && (
        <button
          type="button"
          onClick={() => setActiveModule("classlist")}
          className="mb-8 flex w-full cursor-pointer items-center justify-between rounded-xl2 border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-4 text-left transition-colors hover:bg-primary/10"
        >
          <span className="font-body text-lg text-ink">
            Navnelisten din er tom — legg til navn for å bruke Elevtrekker.
          </span>
          <span className="font-heading font-semibold text-primary">
            Gå til Navnelister →
          </span>
        </button>
      )}

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={toggleEditMode}
          className="flex cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink shadow-clay transition-colors hover:border-primary/40"
        >
          {isEditMode ? (
            <>
              <Check size={18} aria-hidden="true" />
              Ferdig
            </>
          ) : (
            <>
              <Pencil size={18} aria-hidden="true" />
              Rediger moduler
            </>
          )}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visible.map((m) => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {visible.map((m) => (
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ModuleDrawer modules={hidden} onRestore={showModule} />
    </div>
  );
}

export default Dashboard;
