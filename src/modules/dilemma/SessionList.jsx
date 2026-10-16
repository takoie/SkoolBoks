import { useState } from "react";
import {
  Plus,
  Play,
  Pencil,
  Share2,
  Trash2,
  Copy,
  Upload,
  Search,
  Sparkles,
  GitFork,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { createEmptyDilemmaSession } from "../../lib/dilemmaTypes";
import { DilemmaExportModal, DilemmaImportModal } from "./DilemmaShareModals";

function SessionList({ onOpen, onPresent }) {
  const sessions = useAppStore((s) => s.dilemmaSessions || {});
  const createDilemmaSession = useAppStore((s) => s.createDilemmaSession);
  const deleteDilemmaSession = useAppStore((s) => s.deleteDilemmaSession);
  const duplicateDilemmaSession = useAppStore((s) => s.duplicateDilemmaSession);

  const [searchQuery, setSearchQuery] = useState("");
  const [exportSession, setExportSession] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const list = Object.values(sessions).sort((a, b) =>
    (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || "")
  );

  const filteredList = list.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  });

  function handleCreateNew() {
    const id = createDilemmaSession("Ny dilemma-økt");
    onOpen(id);
  }

  function handleDelete(session) {
    if (confirm(`Er du sikker på at du vil slette «${session.title}»?`)) {
      deleteDilemmaSession(session.id);
    }
  }

  function handleDuplicate(session) {
    duplicateDilemmaSession(session.id);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GitFork size={28} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold text-ink">Dilemma</h2>
            <p className="text-sm text-ink/60">
              Opprett og kjør interaktive økter med hjørnevalg og dilemmaer i klasserommet
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Upload size={18} aria-hidden="true" />
            Importer økt
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
          >
            <Plus size={20} aria-hidden="true" />
            Ny dilemma-økt
          </button>
        </div>
      </div>

      {/* Search Input */}
      {list.length > 0 && (
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i dilemma-økter..."
            className="w-full rounded-xl border-2 border-ink/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none shadow-sm"
          />
        </div>
      )}

      {/* Empty State */}
      {filteredList.length === 0 ? (
        <div className="rounded-xl2 border-2 border-dashed border-ink/20 bg-surface/50 p-12 text-center">
          <Sparkles size={40} className="mx-auto mb-3 text-primary/60" />
          <h3 className="font-heading text-xl font-bold text-ink">
            Ingen dilemma-økter funnet
          </h3>
          <p className="mt-1 text-sm text-ink/60 max-w-md mx-auto">
            {searchQuery
              ? "Ingen økter matchet søket ditt."
              : "Trykk på «Ny dilemma-økt» for å opprette din første økt eller importer en delingskode."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleCreateNew}
              className="rounded-xl bg-primary px-5 py-2.5 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Opprett ny økt
            </button>
          </div>
        </div>
      ) : (
        /* Sessions Grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredList.map((session) => (
            <div
              key={session.id}
              className="flex flex-col justify-between rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay transition-all hover:border-primary/30"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-xl font-bold text-ink leading-snug">
                    {session.title}
                  </h3>
                  {session.id.startsWith("preset-") && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-heading text-xs font-bold text-primary shrink-0">
                      Mal
                    </span>
                  )}
                </div>

                {session.description && (
                  <p className="mt-1 text-sm text-ink/70 line-clamp-2">
                    {session.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-ink/50">
                  <span>{session.dilemmas?.length || 0} dilemmaer</span>
                  <span>•</span>
                  <span>
                    Oppdatert:{" "}
                    {new Date(session.updatedAt || session.createdAt).toLocaleDateString("no-NO")}
                  </span>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => onPresent(session.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
                >
                  <Play size={16} aria-hidden="true" />
                  Kjør økt
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpen(session.id)}
                    title="Rediger økt"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportSession(session)}
                    title="Del / Eksporter"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
                  >
                    <Share2 size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(session)}
                    title="Dupliser økt"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
                  >
                    <Copy size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(session)}
                    title="Slett økt"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share/Export Modal */}
      {exportSession && (
        <DilemmaExportModal
          session={exportSession}
          onClose={() => setExportSession(null)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <DilemmaImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={(newId) => onOpen(newId)}
        />
      )}
    </div>
  );
}

export default SessionList;
