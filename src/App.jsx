import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import AppShell from "./components/AppShell";
import TitleBar from "./components/TitleBar";
import ResizeHandles from "./components/ResizeHandles";
import UpdateChecker from "./components/UpdateChecker";
import Dashboard from "./modules/Dashboard";
import SpinWheel from "./modules/SpinWheel";
import QuizArena from "./modules/quiz/QuizArena";
import Timer from "./modules/Timer";
import ClassList from "./modules/ClassList";
import NearestThousand from "./modules/NearestThousand";
import DiceRoller from "./modules/DiceRoller";
import StiansGame from "./modules/StiansGame";
import WheelArena from "./modules/wheel/WheelArena";
import GjetteArena from "./modules/gjette/GjetteArena";
import TofaktaArena from "./modules/tofakta/TofaktaArena";
import BombArena from "./modules/bomb/BombArena";
import HangmanArena from "./modules/hangman/HangmanArena";
import AdjektivfortellingArena from "./modules/adjektivfortelling/AdjektivfortellingArena";
import GangemesterArena from "./modules/gangemester/GangemesterArena";
import NoiseMeterArena from "./modules/noisemeter/NoiseMeterArena";

const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  spinwheel: SpinWheel,
  quizarena: QuizArena,
  timer: Timer,
  classlist: ClassList,
  nearestthousand: NearestThousand,
  dice: DiceRoller,
  stiansgame: StiansGame,
  wheel: WheelArena,
  gjette: GjetteArena,
  tofakta: TofaktaArena,
  bomb: BombArena,
  hangman: HangmanArena,
  adjektivfortelling: AdjektivfortellingArena,
  gangemester: GangemesterArena,
  noisemeter: NoiseMeterArena,
};

function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const theme = useAppStore((s) => s.settings.theme);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] ?? Dashboard;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ResizeHandles />
      <TitleBar />
      <AppShell>
        <ActiveComponent />
      </AppShell>
      <UpdateChecker />
    </div>
  );
}

export default App;
