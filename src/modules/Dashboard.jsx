import { Dices, Trophy, Timer as TimerIcon, Users } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import ModuleCard from "../components/ModuleCard";

const MODULES = [
  {
    id: "spinwheel",
    icon: Dices,
    title: "Elevtrekker",
    description: "Trekk en tilfeldig elev fra klasselisten.",
    accent: "coral",
  },
  {
    id: "jeopardy",
    icon: Trophy,
    title: "Quiz-arena",
    description: "Kategorier og poeng — Jeopardy-stil.",
    accent: "peach",
  },
  {
    id: "timer",
    icon: TimerIcon,
    title: "Nedtelling",
    description: "Visuell timer med alarm.",
    accent: "lime",
  },
  {
    id: "classlist",
    icon: Users,
    title: "Klasseliste",
    description: "Legg inn og administrer elevlister.",
    accent: "primary",
  },
];

function Dashboard() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "", students: [] }
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Velkommen til SkoolBox
      </h2>
      <p className="mb-8 text-lg text-ink/70">Velg et verktøy for timen.</p>

      {activeClass.students.length === 0 && (
        <button
          type="button"
          onClick={() => setActiveModule("classlist")}
          className="mb-8 flex w-full cursor-pointer items-center justify-between rounded-xl2 border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-4 text-left transition-colors hover:bg-primary/10"
        >
          <span className="font-body text-lg text-ink">
            Klasselisten din er tom — legg til elever for å bruke Elevtrekker.
          </span>
          <span className="font-heading font-semibold text-primary">
            Gå til Klasseliste →
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.id}
            icon={m.icon}
            title={m.title}
            description={m.description}
            accent={m.accent}
            onClick={() => setActiveModule(m.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
