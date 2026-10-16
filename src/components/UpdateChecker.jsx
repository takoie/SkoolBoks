import { useEffect, useRef, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, RefreshCw, X } from "lucide-react";

const STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  UP_TO_DATE: "up_to_date",
  AVAILABLE: "available",
  DOWNLOADING: "downloading",
  READY: "ready",
  ERROR: "error",
};

/**
 * Checks GitHub for a new SkoolBoks release on mount and shows a dismissible
 * banner when one is found. The user drives the download/install; nothing
 * happens automatically beyond the initial check.
 */
function UpdateChecker({ checkOnStartup = true }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const updateRef = useRef(null);

  const checkForUpdate = async () => {
    setStatus(STATUS.CHECKING);
    setErrorMessage("");
    setDismissed(false);
    try {
      const update = await check();
      if (update?.available) {
        updateRef.current = update;
        setStatus(STATUS.AVAILABLE);
      } else {
        updateRef.current = null;
        setStatus(STATUS.UP_TO_DATE);
      }
    } catch (err) {
      console.debug("Update check skipped or unavailable:", err);
      setStatus(STATUS.IDLE);
    }
  };

  useEffect(() => {
    if (checkOnStartup) {
      checkForUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOnStartup]);

  const installUpdate = async () => {
    const update = updateRef.current;
    if (!update) return;

    setStatus(STATUS.DOWNLOADING);
    setProgress({ downloaded: 0, total: 0 });
    try {
      let total = 0;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            setProgress({ downloaded: 0, total });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setProgress({ downloaded, total });
            break;
          case "Finished":
            setProgress((p) => ({ downloaded: p.total || p.downloaded, total: p.total }));
            break;
          default:
            break;
        }
      });
      setStatus(STATUS.READY);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus(STATUS.ERROR);
    }
  };

  const restartNow = async () => {
    await relaunch();
  };

  if (status === STATUS.IDLE || status === STATUS.CHECKING || dismissed) {
    return null;
  }

  if (status === STATUS.UP_TO_DATE) {
    return null;
  }

  const percent =
    progress.total > 0 ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100)) : null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] mx-auto flex w-full max-w-md justify-center px-4">
      <div className="w-full rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-neutral-800">
        {status === STATUS.AVAILABLE && (
          <div className="flex items-start gap-3">
            <Download size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Ny versjon tilgjengelig
              </p>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                Versjon {updateRef.current?.version} er klar for nedlasting.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={installUpdate}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-active"
                >
                  Last ned og installer
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  Senere
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="Lukk"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {status === STATUS.DOWNLOADING && (
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="shrink-0 animate-spin text-primary" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Laster ned oppdatering…</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: percent !== null ? `${percent}%` : "40%" }}
                />
              </div>
            </div>
          </div>
        )}

        {status === STATUS.READY && (
          <div className="flex items-start gap-3">
            <Download size={20} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Oppdatering installert
              </p>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                Start SkoolBoks på nytt for å ta i bruk den nye versjonen.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={restartNow}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-active"
                >
                  Start på nytt
                </button>
              </div>
            </div>
          </div>
        )}

        {status === STATUS.ERROR && (
          <div className="flex items-start gap-3">
            <X size={20} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Kunne ikke oppdatere
              </p>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">{errorMessage}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={checkForUpdate}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-active"
                >
                  Prøv igjen
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdateChecker;
