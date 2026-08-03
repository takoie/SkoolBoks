import { Minus, Square, X, Sun, Moon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "../store/useAppStore";

const appWindow = getCurrentWindow();

function TitleBar() {
  const theme = useAppStore((s) => s.settings.theme);
  const setSettings = useAppStore((s) => s.setSettings);
  const isDark = theme !== "light";

  return (
    <div className="flex h-10 items-center justify-between bg-primary-active pl-3 pr-0 text-white select-none">
      <div
        className="h-full flex-1"
        data-tauri-drag-region
        onDoubleClick={() => appWindow.toggleMaximize()}
      />

      <div className="relative z-[60] flex h-full items-center">
        <button
          type="button"
          onClick={() => setSettings({ theme: isDark ? "light" : "dark" })}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label={isDark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => appWindow.minimize()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label="Minimer"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label="Maksimer/gjenopprett"
        >
          <Square size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => appWindow.close()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-destructive"
          aria-label="Lukk"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
