import { useEffect } from "react";
import { Minus, Square, X, Sun, Moon } from "lucide-react";
import { getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";
import { useAppStore } from "../store/useAppStore";

const appWindow = getCurrentWindow();

// Windows draws a borderless (decorations: false) window's native maximize —
// and Aero Snap's drag-to-top-edge gesture — as the full monitor rectangle,
// since there's no system frame to trigger the normal taskbar-aware sizing.
// That leaves the taskbar rendered on top of the app. Whenever the window's
// bounds grow to match the full monitor, snap them back down to the
// monitor's work area (the region excluding the taskbar) instead.
async function fitToWorkArea() {
  const monitor = await currentMonitor();
  if (!monitor) return;
  const size = await appWindow.outerSize();
  const coversFullMonitor = size.width === monitor.size.width && size.height === monitor.size.height;
  if (!coversFullMonitor) return;
  await appWindow.setPosition(monitor.workArea.position);
  await appWindow.setSize(monitor.workArea.size);
}

function TitleBar() {
  const theme = useAppStore((s) => s.settings.theme);
  const setSettings = useAppStore((s) => s.setSettings);
  const isDark = theme !== "light";

  useEffect(() => {
    let unlisten;
    appWindow.onResized(fitToWorkArea).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

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
