import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Download,
  Printer,
  Layout,
  Palette,
  RotateCw,
  Maximize2,
  List,
  Bold,
  Italic,
  FolderOpen,
  Check,
  Tag,
  Move,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { BOARD_THEMES, NOTE_COLORS } from "../../lib/notaterTypes";
import NewBoardModal from "./components/NewBoardModal";
import FocusNoteModal from "./components/FocusNoteModal";

export default function KlassetavleView() {
  const classBoards = useAppStore((s) => s.classBoards || {});
  const activeBoardId = useAppStore((s) => s.activeBoardId);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);
  const createClassBoard = useAppStore((s) => s.createClassBoard);
  const updateClassBoard = useAppStore((s) => s.updateClassBoard);
  const deleteClassBoard = useAppStore((s) => s.deleteClassBoard);
  const addBoardNote = useAppStore((s) => s.addBoardNote);
  const updateBoardNote = useAppStore((s) => s.updateBoardNote);
  const deleteBoardNote = useAppStore((s) => s.deleteBoardNote);

  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [focusedNoteId, setFocusedNoteId] = useState(null);

  const boardRef = useRef(null);

  const activeBoard = classBoards[activeBoardId] || Object.values(classBoards)[0];

  // Bring note to top by reordering notes array on click
  const bringToFront = (noteId) => {
    setActiveNoteId(noteId);
    if (!activeBoard) return;
    const notes = activeBoard.notesArray || [];
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const reordered = [...notes.filter((n) => n.id !== noteId), note];
    updateClassBoard(activeBoard.id, { notesArray: reordered });
  };

  const dragRef = useRef(null);

  // Dragging logic via direct DOM manipulation for 60 FPS smooth performance
  const handlePointerDown = (e, note) => {
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) {
      return;
    }
    e.preventDefault();
    bringToFront(note.id);

    const cardEl = e.currentTarget;
    dragRef.current = {
      el: cardEl,
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: note.positionX || 50,
      origY: note.positionY || 50,
      currentX: note.positionX || 50,
      currentY: note.positionY || 50,
      rotation: note.rotation || 0,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current) return;
      const { el, startX, startY, origX, origY, rotation } = dragRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newX = Math.max(10, origX + deltaX);
      const newY = Math.max(10, origY + deltaY);

      dragRef.current.currentX = newX;
      dragRef.current.currentY = newY;

      if (el) {
        el.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
      }
    };

    const handlePointerUp = () => {
      if (!dragRef.current) return;
      const { noteId, currentX, currentY } = dragRef.current;
      dragRef.current = null;

      if (activeBoard) {
        updateBoardNote(activeBoard.id, noteId, {
          positionX: currentX,
          positionY: currentY,
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeBoard, updateBoardNote]);

  // Add new note to current board
  const handleAddNote = (color = "yellow") => {
    if (!activeBoard) return;
    const count = (activeBoard.notesArray || []).length;
    const posX = 60 + (count % 4) * 40;
    const posY = 60 + Math.floor(count / 4) * 40;

    const id = addBoardNote(activeBoard.id, {
      title: "Ny lapp",
      content: "",
      color,
      positionX: posX,
      positionY: posY,
      width: 250,
      height: 210,
      rotation: Math.floor(Math.random() * 7) - 3,
    });
    setActiveNoteId(id);
  };

  // Export board to PNG
  const handleExportPNG = async () => {
    if (!boardRef.current || !activeBoard) return;
    const canvasContainer = boardRef.current;

    const canvas = document.createElement("canvas");
    const rect = canvasContainer.getBoundingClientRect();
    const width = Math.max(1200, rect.width);
    const height = Math.max(800, rect.height);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    const themeObj = BOARD_THEMES.find((t) => t.id === activeBoard.theme) || BOARD_THEMES[0];
    if (themeObj.id === "chalkboard") {
      ctx.fillStyle = "#1c2e24";
    } else if (themeObj.id === "cork") {
      ctx.fillStyle = "#8d5431";
    } else {
      ctx.fillStyle = "#f8fafc";
    }
    ctx.fillRect(0, 0, width, height);

    // Draw board title
    ctx.font = "bold 28px Figtree, sans-serif";
    ctx.fillStyle = themeObj.id === "chalkboard" || themeObj.id === "cork" ? "#ffffff" : "#1e293b";
    ctx.fillText(activeBoard.title || "Klassetavle", 40, 50);

    // Draw each note
    const notes = activeBoard.notesArray || [];
    notes.forEach((note) => {
      const colorObj = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
      const x = note.positionX || 50;
      const y = (note.positionY || 50) + 40; // offset for title
      const w = note.width || 250;
      const h = note.height || 200;
      const rot = (note.rotation || 0) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);

      // Note shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w, h);

      // Note background
      ctx.fillStyle = colorObj.accent;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Note header line
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(-w / 2, -h / 2, w, 28);

      // Note Title
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 16px Figtree, sans-serif";
      ctx.fillText(note.title || "", -w / 2 + 12, -h / 2 + 20);

      // Note Content (multiline text)
      ctx.font = "14px Figtree, sans-serif";
      ctx.fillStyle = "#334155";
      const lines = (note.content || "").split("\n");
      lines.forEach((line, idx) => {
        if (idx < 7) {
          ctx.fillText(line, -w / 2 + 12, -h / 2 + 50 + idx * 20);
        }
      });

      ctx.restore();
    });

    // Download PNG link
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${activeBoard.title || "Klassetavle"}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Export board to PDF / Print
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Board Controls Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-border-subtle bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Board Switcher & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={20} className="text-primary" />
            <select
              value={activeBoardId || ""}
              onChange={(e) => setActiveBoardId(e.target.value)}
              className="rounded-xl border border-border-subtle bg-canvas px-3 py-2 font-heading text-sm font-bold text-ink focus:border-primary focus:outline-none"
            >
              {Object.values(classBoards).map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title} ({board.notesArray?.length || 0} lapper)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowNewBoardModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
          >
            <Plus size={16} />
            Ny tavle
          </button>

          {Object.keys(classBoards).length > 1 && activeBoard && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Vil du slette tavlen "${activeBoard.title}"?`)) {
                  deleteClassBoard(activeBoard.id);
                }
              }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-600"
              title="Slett tavle"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Right: Add Note, Theme Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Theme Selector */}
          <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-canvas p-1">
            {BOARD_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() =>
                  activeBoard &&
                  updateClassBoard(activeBoard.id, { theme: theme.id })
                }
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeBoard?.theme === theme.id
                    ? "bg-primary text-primary-contrast"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>

          {/* Add Note Button */}
          <button
            type="button"
            onClick={() => handleAddNote("yellow")}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-contrast shadow-sm transition-transform hover:bg-primary-hover active:scale-95"
          >
            <Plus size={16} />
            Legg til lapp
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-canvas px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-primary/10 hover:text-primary active:scale-95"
            title="Eksporter som PNG-bilde"
          >
            <Download size={15} />
            Eksport (PNG)
          </button>

          {/* Export PDF / Print */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-canvas px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-primary/10 hover:text-primary active:scale-95"
            title="Skriv ut eller lagre som PDF"
          >
            <Printer size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Board Interactive Canvas Area */}
      {activeBoard ? (
        <div
          ref={boardRef}
          className={`relative min-h-[620px] w-full rounded-2xl border-4 border-border-subtle p-6 overflow-hidden shadow-inner transition-colors ${
            BOARD_THEMES.find((t) => t.id === activeBoard.theme)?.bgClass ||
            "bg-slate-900"
          }`}
          style={{
            backgroundImage: BOARD_THEMES.find((t) => t.id === activeBoard.theme)
              ?.gridStyle,
            backgroundSize: "24px 24px",
          }}
        >
          {/* Board Title Watermark / Header */}
          <div className="absolute top-4 left-6 pointer-events-none select-none opacity-40">
            <h2 className="font-heading text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {activeBoard.title}
            </h2>
          </div>

          {/* Notes Canvas Layer */}
          {(activeBoard.notesArray || []).map((note) => {
            const colorObj =
              NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];
            const isSelected = activeNoteId === note.id;

            return (
              <div
                key={note.id}
                onPointerDown={(e) => handlePointerDown(e, note)}
                style={{
                  transform: `translate(${note.positionX || 40}px, ${
                    note.positionY || 40
                  }px) rotate(${note.rotation || 0}deg)`,
                  width: `${note.width || 250}px`,
                  height: `${note.height || 210}px`,
                }}
                className={`absolute top-0 left-0 flex flex-col rounded-xl border-2 ${
                  colorObj.border
                } ${colorObj.bg} ${colorObj.text} shadow-xl transition-shadow ${
                  isSelected ? "ring-4 ring-primary/60 z-30" : "z-10 hover:z-20"
                }`}
              >
                {/* Header Drag Handle & Controls */}
                <div
                  className={`flex cursor-move items-center justify-between border-b ${colorObj.border} ${colorObj.header} px-3 py-1.5 rounded-t-xl select-none`}
                >
                  <div className="flex items-center gap-1 opacity-70">
                    <Move size={13} />
                    <span className="font-heading text-[10px] font-bold uppercase tracking-wider">
                      Lapp
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Focus / Framhev button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedNoteId(note.id);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full opacity-60 hover:bg-black/10 hover:opacity-100"
                      title="Framhev notat (vis kun dette notatet)"
                    >
                      <Maximize2 size={12} />
                    </button>

                    {/* Rotate button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextRot = (((note.rotation || 0) + 5 + 15) % 30) - 15;
                        updateBoardNote(activeBoard.id, note.id, {
                          rotation: nextRot,
                        });
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full opacity-60 hover:bg-black/10 hover:opacity-100"
                      title="Roter lapp"
                    >
                      <RotateCw size={12} />
                    </button>

                    {/* Delete note */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoardNote(activeBoard.id, note.id);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full opacity-60 hover:bg-red-500/20 hover:text-red-700 hover:opacity-100"
                      title="Slett lapp"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Formatting bar */}
                <div
                  className={`flex items-center justify-between border-b ${colorObj.border} px-2 py-1 bg-black/5 text-slate-900 text-[11px] select-none`}
                >
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBoardNote(activeBoard.id, note.id, { isBold: !note.isBold });
                      }}
                      className={`flex h-5 w-5 items-center justify-center rounded font-bold transition-colors ${
                        note.isBold ? "bg-black/20 text-slate-950" : "hover:bg-black/10"
                      }`}
                      title="Fet skrift"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBoardNote(activeBoard.id, note.id, { isItalic: !note.isItalic });
                      }}
                      className={`flex h-5 w-5 items-center justify-center rounded italic transition-colors ${
                        note.isItalic ? "bg-black/20 text-slate-950" : "hover:bg-black/10"
                      }`}
                      title="Kursiv skrift"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const current = note.content || "";
                        const hasBullet = current.startsWith("- ");
                        const next = hasBullet ? current.replace(/^- /gm, "") : `- ${current}`;
                        updateBoardNote(activeBoard.id, note.id, { content: next });
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/10"
                      title="Punktliste"
                    >
                      <List size={12} />
                    </button>
                  </div>

                  <select
                    value={note.fontSize || "base"}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateBoardNote(activeBoard.id, note.id, { fontSize: e.target.value });
                    }}
                    className="bg-transparent font-heading text-[10px] font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="sm">Liten</option>
                    <option value="base">Normal</option>
                    <option value="lg">Stor</option>
                    <option value="xl">Ekstra stor</option>
                  </select>
                </div>

                {/* Content Editor */}
                <div className="flex flex-1 flex-col p-3 space-y-2">
                  <input
                    type="text"
                    spellCheck={false}
                    value={note.title || ""}
                    onChange={(e) =>
                      updateBoardNote(activeBoard.id, note.id, {
                        title: e.target.value,
                      })
                    }
                    placeholder="Tittel..."
                    className={`w-full bg-transparent font-heading text-sm font-bold text-slate-950 placeholder:text-slate-700/50 focus:outline-none ${
                      note.isBold ? "font-black" : ""
                    } ${note.isItalic ? "italic" : ""}`}
                  />

                  <textarea
                    spellCheck={false}
                    value={note.content || ""}
                    onChange={(e) =>
                      updateBoardNote(activeBoard.id, note.id, {
                        content: e.target.value,
                      })
                    }
                    placeholder="Skriv innhold her..."
                    className={`w-full flex-1 resize-none bg-transparent font-body text-slate-900 placeholder:text-slate-700/50 focus:outline-none ${
                      note.fontSize === "lg"
                        ? "text-base"
                        : note.fontSize === "xl"
                        ? "text-lg font-medium"
                        : note.fontSize === "sm"
                        ? "text-[11px]"
                        : "text-xs"
                    } ${note.isBold ? "font-bold" : ""} ${
                      note.isItalic ? "italic" : ""
                    }`}
                  />
                </div>

                {/* Footer Controls: Date & Palette */}
                <div
                  className={`flex items-center justify-between border-t ${colorObj.border} px-2.5 py-1.5 rounded-b-xl text-xs select-none`}
                >
                  <span className="text-[10px] font-semibold text-slate-800 opacity-75">
                    {note.createdAt
                      ? new Date(note.createdAt).toLocaleDateString("no-NO", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </span>

                  {/* Color palette */}
                  <div className="flex items-center gap-1">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBoardNote(activeBoard.id, note.id, {
                            color: c.id,
                          });
                        }}
                        className={`h-3.5 w-3.5 rounded-full border border-black/30 transition-transform ${
                          note.color === c.id
                            ? "scale-125 ring-1 ring-black/50"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c.accent }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle p-12 text-center">
          <p className="text-sm font-semibold text-ink-muted">
            Ingen tavle er valgt.
          </p>
          <button
            type="button"
            onClick={() => setShowNewBoardModal(true)}
            className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-contrast"
          >
            Opprett ny klassetavle
          </button>
        </div>
      )}

      {/* New Board Modal */}
      {showNewBoardModal && (
        <NewBoardModal
          onClose={() => setShowNewBoardModal(false)}
          onConfirm={(title, theme) => {
            createClassBoard(title, theme);
            setShowNewBoardModal(false);
          }}
        />
      )}

      {/* Focus Note Modal (Framhevet enkeltnotat) */}
      {focusedNoteId && activeBoard && (
        <FocusNoteModal
          notes={activeBoard.notesArray || []}
          initialNoteId={focusedNoteId}
          onClose={() => setFocusedNoteId(null)}
          onUpdateNote={(noteId, updates) =>
            updateBoardNote(activeBoard.id, noteId, updates)
          }
        />
      )}
    </div>
  );
}
