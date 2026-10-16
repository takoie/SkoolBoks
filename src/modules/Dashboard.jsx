import { useState } from "react";
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
  Volume2,
  VenetianMask,
  PartyPopper,
  ListOrdered,
  CalendarDays,
  Check,
  Pencil,
  FolderPlus,
  GitFork,
  StickyNote,
  Cloud,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAppStore, normalizeDashboardState } from "../store/useAppStore";
import ModuleDrawer from "../components/ModuleDrawer";
import DashboardDrawer from "./dashboard/DashboardDrawer";
import stianIcon from "../img/stian.png";

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
  {
    id: "mafia",
    icon: VenetianMask,
    title: "Mafia",
    description: "Klassisk gruppespill — led natten, diskuter og avslør mafiaen.",
  },
  {
    id: "byebye",
    icon: PartyPopper,
    title: "Byebye!",
    description: "Trekk hvem som kan rydde og gå hjem — farger, bursdag, bokstaver eller navn.",
  },
  {
    id: "oktplan",
    icon: ListOrdered,
    title: "Øktplan",
    description: "Bygg og kjør sammensatte økter med tidsintervaller og klasseromsaktiviteter.",
  },
  {
    id: "ukas",
    icon: CalendarDays,
    title: "Ukas..",
    description: "Tidsplan og logistikk for roterende elevaktiviteter uten karakterer.",
  },
  {
    id: "dilemma",
    icon: GitFork,
    title: "Dilemma",
    description: "Opprett og kjør økter med visuelle dilemmaer — hjørnevalg og standpunkter.",
  },
  {
    id: "notater",
    icon: StickyNote,
    title: "Notater",
    description: "Personlige sticky notes og interaktiv klassetavle.",
  },
  {
    id: "ordskytankekart",
    icon: GitFork,
    title: "Tankekart",
    description: "Visuelt tankekart og interaktiv tavle for klasserommet.",
  },
];

let nextAccentIndex = 0;
for (const m of MODULES) {
  if (!m.accent && !m.image) {
    m.accent = ACCENT_ORDER[nextAccentIndex % ACCENT_ORDER.length];
    nextAccentIndex += 1;
  }
}

const MODULES_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));
const ALL_MODULE_IDS = MODULES.map((m) => m.id);

function resolveDashboard(dashboard) {
  const normalized = normalizeDashboardState(dashboard, ALL_MODULE_IDS);

  const categories = normalized.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    modules: cat.moduleIds.map((id) => MODULES_BY_ID[id]).filter(Boolean),
  }));

  const hidden = normalized.hidden.map((id) => MODULES_BY_ID[id]).filter(Boolean);

  return { categories, hidden, rawCategories: normalized.categories };
}

function Dashboard() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const dashboard = useAppStore((s) => s.dashboard);
  const isEditMode = useAppStore((s) => s.isEditMode);
  const toggleEditMode = useAppStore((s) => s.toggleEditMode);
  const hideModule = useAppStore((s) => s.hideModule);
  const showModule = useAppStore((s) => s.showModule);
  const addCategory = useAppStore((s) => s.addCategory);
  const renameCategory = useAppStore((s) => s.renameCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const moveCategory = useAppStore((s) => s.moveCategory);
  const moveModuleToCategory = useAppStore((s) => s.moveModuleToCategory);
  const reorderModulesInCategory = useAppStore(
    (s) => s.reorderModulesInCategory
  );

  const { categories, hidden, rawCategories } = resolveDashboard(dashboard);

  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function toggleCollapse(catId) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  }

  function handleAddCategorySubmit(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
    setIsCreatingCategory(false);
  }

  function handleRenameSubmit(catId, e) {
    e.preventDefault();
    if (editingName.trim()) {
      renameCategory(catId, editingName.trim());
    }
    setEditingCategoryId(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let sourceCatId = null;
    if (hidden.some((m) => m.id === activeId)) {
      sourceCatId = "hidden";
    } else {
      const cat = categories.find((c) =>
        c.modules.some((m) => m.id === activeId)
      );
      if (cat) sourceCatId = cat.id;
    }

    if (!sourceCatId) return;

    let targetCatId = null;
    if (
      overId === "hidden-drawer" ||
      hidden.some((m) => m.id === overId)
    ) {
      targetCatId = "hidden";
    } else {
      const targetCat = categories.find(
        (c) =>
          c.id === overId ||
          `cat-container-${c.id}` === overId ||
          c.modules.some((m) => m.id === overId)
      );
      if (targetCat) targetCatId = targetCat.id;
    }

    if (!targetCatId) return;

    if (sourceCatId === targetCatId) {
      if (sourceCatId === "hidden") {
        const hiddenIds = hidden.map((m) => m.id);
        const oldIndex = hiddenIds.indexOf(activeId);
        const newIndex = hiddenIds.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderModulesInCategory("hidden", arrayMove(hiddenIds, oldIndex, newIndex));
        }
      } else {
        const cat = categories.find((c) => c.id === sourceCatId);
        const moduleIds = cat.modules.map((m) => m.id);
        const oldIndex = moduleIds.indexOf(activeId);
        const newIndex = moduleIds.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderModulesInCategory(
            sourceCatId,
            arrayMove(moduleIds, oldIndex, newIndex)
          );
        }
      }
    } else {
      moveModuleToCategory(activeId, targetCatId);
    }
  }

  const categoryOptions = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="w-full">
      {/* Top action bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {isCreatingCategory ? (
            <form
              onSubmit={handleAddCategorySubmit}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                autoFocus
                placeholder="Kategorinavn..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="rounded-xl border-2 border-primary/40 bg-surface px-4 py-2 font-heading font-semibold text-ink focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-primary bg-primary px-4 py-2 font-heading font-semibold text-white shadow-clay transition-all hover:bg-primary-hover"
              >
                Lagre
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName("");
                }}
                className="cursor-pointer rounded-xl border-2 border-ink/10 bg-surface px-3 py-2 font-heading font-semibold text-ink/70 hover:bg-ink/5"
              >
                Avbryt
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingCategory(true)}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl2 border-2 border-primary/30 bg-primary/5 px-5 py-2.5 font-heading font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FolderPlus size={20} aria-hidden="true" />
              Opprett ny kategori
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleEditMode}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl2 border-2 border-border-subtle bg-surface px-5 py-2.5 font-heading font-semibold text-ink shadow-clay transition-colors hover:border-primary/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
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
        <div className="space-y-8">
          {categories.map((cat, index) => (
            <DashboardDrawer
              key={cat.id}
              cat={cat}
              index={index}
              totalCategories={categories.length}
              isCollapsed={collapsedCategories[cat.id]}
              isEditingThisCat={editingCategoryId === cat.id}
              editingName={editingName}
              setEditingName={setEditingName}
              setEditingCategoryId={setEditingCategoryId}
              onToggleCollapse={toggleCollapse}
              onRenameSubmit={handleRenameSubmit}
              onMoveCategory={moveCategory}
              onDeleteCategory={deleteCategory}
              isEditMode={isEditMode}
              setActiveModule={setActiveModule}
              hideModule={hideModule}
              moveModuleToCategory={moveModuleToCategory}
              categoryOptions={categoryOptions}
            />
          ))}
        </div>
      </DndContext>

      {/* Hidden modules drawer at the bottom */}
      <div id="hidden-drawer">
        <ModuleDrawer
          modules={hidden}
          categories={categoryOptions}
          onRestore={(id, targetCatId) => showModule(id, targetCatId)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
