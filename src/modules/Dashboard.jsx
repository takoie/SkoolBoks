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
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import ModuleCard from "../components/ModuleCard";
import stianIcon from "../img/stian.png";

const MODULES = [
  {
    id: "spinwheel",
    icon: Dices,
    title: "Elevtrekker",
    description: "Trekk et tilfeldig navn fra navnelisten.",
    accent: "coral",
  },
  {
    id: "quizarena",
    icon: Trophy,
    title: "Quiz-arena",
    description: "Lag og spill quiz — kategorier og poeng.",
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
    id: "nearestthousand",
    icon: Hash,
    title: "Nærmest tusen",
    description: "Trekk 9 siffer og kom nærmest 1000.",
    accent: "peach",
  },
  {
    id: "dice",
    icon: Dice5,
    title: "Terningkast",
    description: "Kast en eller flere terninger.",
    accent: "coral",
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
    accent: "lime",
  },
  {
    id: "gjette",
    icon: Grid3x3,
    title: "GjettE",
    description: "Gjett dagens ord — bokmål, nynorsk eller engelsk.",
    accent: "secondary",
  },
  {
    id: "tofakta",
    icon: Drama,
    title: "2+1 fake",
    description: "To sanne påstander og én løgn — la klassen gjette.",
    accent: "coral",
  },
  {
    id: "bomb",
    icon: Bomb,
    title: "Send bomben",
    description: "Nedtelling, ord og en bombe som går av.",
    accent: "coral",
  },
  {
    id: "hangman",
    icon: Skull,
    title: "Hangman",
    description: "Klassisk hangman — tilfeldig ord eller gamehost-modus.",
    accent: "secondary",
  },
  {
    id: "adjektivfortelling",
    icon: Feather,
    title: "Adjektivfortelling",
    description: "Fyll inn adjektiv, substantiv og verb — les historien sammen etterpå.",
    accent: "peach",
  },
];

function Dashboard() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "", students: [] }
  );

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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.id}
            icon={m.icon}
            image={m.image}
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
