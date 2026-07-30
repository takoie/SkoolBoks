import { useAppStore } from "./store/useAppStore";
import AppShell from "./components/AppShell";
import Dashboard from "./modules/Dashboard";
import SpinWheel from "./modules/SpinWheel";
import QuizArena from "./modules/quiz/QuizArena";
import Timer from "./modules/Timer";
import ClassList from "./modules/ClassList";
import NearestThousand from "./modules/NearestThousand";
import DiceRoller from "./modules/DiceRoller";

const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  spinwheel: SpinWheel,
  quizarena: QuizArena,
  timer: Timer,
  classlist: ClassList,
  nearestthousand: NearestThousand,
  dice: DiceRoller,
};

function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] ?? Dashboard;

  return (
    <AppShell>
      <ActiveComponent />
    </AppShell>
  );
}

export default App;
