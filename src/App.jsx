import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import AppShell from "./components/AppShell";
import Dashboard from "./modules/Dashboard";
import SpinWheel from "./modules/SpinWheel";
import Jeopardy from "./modules/Jeopardy";
import Timer from "./modules/Timer";
import ClassList from "./modules/ClassList";

const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  spinwheel: SpinWheel,
  jeopardy: Jeopardy,
  timer: Timer,
  classlist: ClassList,
};

function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const theme = useAppStore((s) => s.settings.theme);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] ?? Dashboard;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  return (
    <AppShell>
      <ActiveComponent />
    </AppShell>
  );
}

export default App;
