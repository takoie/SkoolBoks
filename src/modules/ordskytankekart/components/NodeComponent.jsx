import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrdskyStore } from "../store/useOrdskyStore";
import { NODE_COLORS } from "../utils/layoutAlgorithms";
import { Plus, Link2, Trash2, Palette, Sparkles, ChevronUp, ChevronDown, X, Tag } from "lucide-react";

export default function NodeComponent({
  node,
  isSelected,
  onStartDrag,
  onStartConnect,
  onContextMenu,
  isEditingExternal,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const [showRadialMenu, setShowRadialMenu] = useState(false);

  const session = useOrdskyStore((s) => s.getActiveSession());
  const updateNodeWithHistory = useOrdskyStore((s) => s.updateNodeWithHistory);
  const deleteNode = useOrdskyStore((s) => s.deleteNode);
  const addChildNode = useOrdskyStore((s) => s.addChildNode);
  const setSelectedNodeIds = useOrdskyStore((s) => s.setSelectedNodeIds);

  const inputRef = useRef(null);

  useEffect(() => {
    setText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (isEditingExternal) {
      setIsEditing(true);
    }
  }, [isEditingExternal]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Auto-close radial menu after 6 seconds or when node becomes unselected
  useEffect(() => {
    if (!isSelected && showRadialMenu) {
      setShowRadialMenu(false);
    }
  }, [isSelected, showRadialMenu]);

  useEffect(() => {
    if (showRadialMenu) {
      const timer = setTimeout(() => {
        setShowRadialMenu(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showRadialMenu]);

  const setEditingNodeId = useOrdskyStore((s) => s.setEditingNodeId);

  const handleFinishEditing = () => {
    setIsEditing(false);
    setEditingNodeId(null);
    if (text.trim() && text !== node.text) {
      updateNodeWithHistory(node.id, { text: text.trim() });
    } else {
      setText(node.text);
    }
  };

  const colorConfig = NODE_COLORS[node.color] || NODE_COLORS.primary;

  // Tag border color lookup
  const tagColorKey = node.tag ? (session?.tagColors?.[node.tag] || "amber") : null;
  const tagStrokeColor = tagColorKey ? (NODE_COLORS[tagColorKey]?.stroke || "#f59e0b") : null;

  // Dynamic font size
  const baseSize = node.isRoot ? 15 : 12;
  const fontSize = baseSize + (node.weight || 5) * 1.2;

  // Shape class & style helper
  const getShapeStyles = () => {
    if (node.shape === "underline") {
      return {
        className: "rounded-none border-b-4 border-t-0 border-x-0 bg-transparent px-2.5 py-1 shadow-none font-bold",
        style: {
          borderColor: colorConfig.stroke,
          color: colorConfig.stroke,
          fontSize: `${fontSize}px`,
        },
      };
    }

    let shapeClasses = "rounded-2xl px-3.5 py-1.5 shadow-sm min-w-[64px]";
    if (node.shape === "capsule") shapeClasses = "rounded-full px-4 py-1.5 shadow-sm min-w-[64px]";
    else if (node.shape === "cloud") shapeClasses = "rounded-[1.5rem] px-4 py-2 border-dashed border-2 shadow-sm min-w-[64px]";

    return {
      className: `${shapeClasses} ${colorConfig.bg}`,
      style: { fontSize: `${fontSize}px` },
    };
  };

  const shapeConfig = getShapeStyles();

  return (
    <div
      data-node-id={node.id}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0px)`,
        position: "absolute",
        top: 0,
        left: 0,
        willChange: "transform",
      }}
      className="select-none group touch-none -translate-x-1/2 -translate-y-1/2 z-10"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeIds([node.id]);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedNodeIds([node.id]);
        if (onContextMenu) onContextMenu(e, node.id);
      }}
    >
      {/* Node Container Card */}
      <div
        onMouseDown={(e) => onStartDrag(e, node.id)}
        onTouchStart={(e) => onStartDrag(e, node.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        style={{
          ...shapeConfig.style,
          ...(tagStrokeColor ? { outline: `3px solid ${tagStrokeColor}`, outlineOffset: "3px" } : {}),
        }}
        className={`relative flex items-center justify-center font-heading font-bold cursor-grab active:cursor-grabbing border-2 transition-shadow duration-75 ${
          shapeConfig.className
        } ${isSelected ? "ring-4 ring-primary/40 scale-105 shadow-xl z-20" : "hover:shadow-lg hover:scale-102"}`}
      >
        {/* Topic Tag Badge Chip (Upper Left - Larger & Clearer) */}
        {node.tag && (
          <span
            style={{ backgroundColor: tagStrokeColor || "#f59e0b" }}
            className="absolute -top-4 left-3 flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 font-heading text-xs font-bold text-white shadow-md border border-white/40 pointer-events-none z-30"
          >
            <Tag size={12} />
            {node.tag}
          </span>
        )}

        {/* Root Node Badge (Upper Right) */}
        {node.isRoot && (
          <span className="absolute -top-3.5 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-xs border border-amber-500 pointer-events-none">
            Hovedtema
          </span>
        )}

        {/* Inline Text Edit vs Display */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleFinishEditing();
              if (e.key === "Escape") {
                setText(node.text);
                setIsEditing(false);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-center font-bold outline-none border-b-2 border-current min-w-[80px] cursor-text select-text pointer-events-auto"
          />
        ) : (
          <span className="whitespace-nowrap px-1">{node.text}</span>
        )}

        {/* Toggle Radial Action Menu Button (+ icon on right) */}
        <button
          type="button"
          title="Åpne meny (+ / Lenke / Slett)"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeIds([node.id]);
            setShowRadialMenu((prev) => !prev);
          }}
          className={`absolute -right-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md border-2 border-white transition-all duration-150 z-30 cursor-pointer ${
            showRadialMenu
              ? "bg-slate-900 scale-110 opacity-100"
              : isSelected
              ? "bg-primary opacity-100 hover:scale-125"
              : "bg-primary opacity-100 sm:opacity-80 group-hover:opacity-100 hover:scale-125"
          }`}
        >
          {showRadialMenu ? <X size={14} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Animated Circular Radial Action Menu */}
      <AnimatePresence>
        {showRadialMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-[-115px] top-1/2 -translate-y-1/2 flex items-center gap-2.5 z-40 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Add Child Node Button (+) */}
            <motion.button
              type="button"
              title="Opprett ny undernode (Tab)"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                addChildNode(node.id);
                setShowRadialMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
            >
              <Plus size={18} />
            </motion.button>

            {/* 2. Drag Connection Button (Lenke-ikon) */}
            <motion.button
              type="button"
              title="Dra herfra for å koble/lenke til en annen boks"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnect(e, node.id);
                setShowRadialMenu(false);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onStartConnect(e, node.id);
                setShowRadialMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-md hover:bg-sky-600 cursor-crosshair"
            >
              <Link2 size={16} className="rotate-45" />
            </motion.button>

            {/* 3. Delete Node Button (Slette-ikon) */}
            <motion.button
              type="button"
              title="Slett boks (Delete)"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
                setShowRadialMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600"
            >
              <Trash2 size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Quick Toolbar when selected */}
      {isSelected && !showRadialMenu && (
        <div
          className="absolute left-1/2 -top-12 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-900/90 text-white p-1 shadow-xl backdrop-blur-xs z-40 text-xs animate-fade-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Weight Size Up */}
          <button
            type="button"
            title="Øk størrelse"
            onClick={() =>
              updateNodeWithHistory(node.id, { weight: Math.min(10, (node.weight || 5) + 1) })
            }
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
          >
            <ChevronUp size={16} />
          </button>

          {/* Weight Size Down */}
          <button
            type="button"
            title="Mink størrelse"
            onClick={() =>
              updateNodeWithHistory(node.id, { weight: Math.max(1, (node.weight || 5) - 1) })
            }
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
          >
            <ChevronDown size={16} />
          </button>

          <div className="h-4 w-px bg-white/20 my-auto" />

          {/* Color Palette Toggle */}
          <button
            type="button"
            title="Bytt farge"
            onClick={() => {
              const keys = Object.keys(NODE_COLORS);
              const nextIndex = (keys.indexOf(node.color) + 1) % keys.length;
              updateNodeWithHistory(node.id, { color: keys[nextIndex] });
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 text-amber-300"
          >
            <Palette size={14} />
          </button>

          {/* Shape Cycle Toggle */}
          <button
            type="button"
            title="Endre form"
            onClick={() => {
              const shapes = ["rounded", "capsule", "cloud", "underline"];
              const nextShape = shapes[(shapes.indexOf(node.shape) + 1) % shapes.length];
              updateNodeWithHistory(node.id, { shape: nextShape });
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
          >
            <Sparkles size={14} />
          </button>

          <div className="h-4 w-px bg-white/20 my-auto" />

          {/* Delete Node */}
          <button
            type="button"
            title="Slett boks (Delete)"
            onClick={() => deleteNode(node.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-500 text-rose-300 hover:text-white"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
