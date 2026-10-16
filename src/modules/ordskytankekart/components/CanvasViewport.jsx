import React, { useRef, useState, useEffect, useCallback } from "react";
import { useOrdskyStore } from "../store/useOrdskyStore";
import SvgConnections from "./SvgConnections";
import NodeComponent from "./NodeComponent";
import NodeContextMenu from "./NodeContextMenu";

export default function CanvasViewport({ viewportRef }) {
  const session = useOrdskyStore((s) => s.getActiveSession());
  const selectedNodeIds = useOrdskyStore((s) => s.selectedNodeIds);
  const setSelectedNodeIds = useOrdskyStore((s) => s.setSelectedNodeIds);
  const clearSelection = useOrdskyStore((s) => s.clearSelection);
  const setViewState = useOrdskyStore((s) => s.setViewState);
  const updateNode = useOrdskyStore((s) => s.updateNode);
  const updateNodeWithHistory = useOrdskyStore((s) => s.updateNodeWithHistory);
  const addNode = useOrdskyStore((s) => s.addNode);
  const addConnection = useOrdskyStore((s) => s.addConnection);
  const connectingFromId = useOrdskyStore((s) => s.connectingFromId);
  const setConnectingFromId = useOrdskyStore((s) => s.setConnectingFromId);
  const deleteSelected = useOrdskyStore((s) => s.deleteSelected);
  const addChildNode = useOrdskyStore((s) => s.addChildNode);
  const undo = useOrdskyStore((s) => s.undo);
  const redo = useOrdskyStore((s) => s.redo);

  const viewState = session?.viewState || { zoom: 1, panX: 0, panY: 0 };
  const canvasTheme = session?.canvasTheme || "light";
  const nodes = session?.nodes || [];

  // Drag & Viewport states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Multi-node dragging initial state map
  const [dragInitialPositions, setDragInitialPositions] = useState(null);
  const [dragStartCanvasPos, setDragStartCanvasPos] = useState(null);

  // Marquee selection box state
  const [isSelectingMarquee, setIsSelectingMarquee] = useState(false);
  const [marqueeStartPos, setMarqueeStartPos] = useState(null);
  const [marqueeCurrentPos, setMarqueeCurrentPos] = useState(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState(null);

  const editingNodeId = useOrdskyStore((s) => s.editingNodeId);
  const setEditingNodeId = useOrdskyStore((s) => s.setEditingNodeId);

  const containerRef = useRef(null);

  // Convert screen pixels to canvas coordinates
  const screenToCanvas = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const x = (clientX - rect.left - centerX - viewState.panX) / viewState.zoom;
      const y = (clientY - rect.top - centerY - viewState.panY) / viewState.zoom;

      return { x: Math.round(x), y: Math.round(y) };
    },
    [viewState]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          addChildNode(selectedNodeIds[0]);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          const selected = nodes.find((n) => n.id === selectedNodeIds[0]);
          if (selected) {
            addNode({
              text: "Ny undernode",
              x: selected.x + 180,
              y: selected.y + 60,
              color: selected.color,
            });
          }
        } else {
          addNode({ text: "Nytt begrep", x: 0, y: 0 });
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, nodes, deleteSelected, addChildNode, addNode, undo, redo]);

  // Pointer Down on Background
  const handlePointerDownBackground = (e) => {
    setContextMenu(null);
    if (e.target === containerRef.current || e.target.tagName === "svg") {
      const isRightClick = e.button === 2;
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (isRightClick || e.shiftKey) {
        setIsSelectingMarquee(true);
        setMarqueeStartPos(pos);
        setMarqueeCurrentPos(pos);
        clearSelection();
      } else {
        clearSelection();
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewState.panX, y: e.clientY - viewState.panY });
      }
    }
  };

  // Node Drag Start
  const handleStartNodeDrag = (e, nodeId) => {
    setContextMenu(null);
    const isTouch = !!e.touches;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const currentSelected = selectedNodeIds.includes(nodeId)
      ? selectedNodeIds
      : [nodeId];

    if (!selectedNodeIds.includes(nodeId)) {
      setSelectedNodeIds([nodeId]);
    }

    const pos = screenToCanvas(clientX, clientY);
    setDragStartCanvasPos(pos);

    const initialMap = {};
    nodes.forEach((n) => {
      if (currentSelected.includes(n.id)) {
        initialMap[n.id] = { x: n.x, y: n.y };
      }
    });
    setDragInitialPositions(initialMap);
  };

  // Connection Drag Start
  const handleStartConnect = (e, nodeId) => {
    setContextMenu(null);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setConnectingFromId(nodeId);
    setMarqueeCurrentPos(screenToCanvas(clientX, clientY));
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    const isTouch = !!e.touches;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    if (isPanning) {
      setViewState((vs) => ({
        ...vs,
        panX: clientX - panStart.x,
        panY: clientY - panStart.y,
      }));
    } else if (isSelectingMarquee && marqueeStartPos) {
      const currentPos = screenToCanvas(clientX, clientY);
      setMarqueeCurrentPos(currentPos);

      const minX = Math.min(marqueeStartPos.x, currentPos.x);
      const maxX = Math.max(marqueeStartPos.x, currentPos.x);
      const minY = Math.min(marqueeStartPos.y, currentPos.y);
      const maxY = Math.max(marqueeStartPos.y, currentPos.y);

      const enclosedIds = nodes
        .filter((n) => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY)
        .map((n) => n.id);

      setSelectedNodeIds(enclosedIds);
    } else if (dragInitialPositions && dragStartCanvasPos) {
      const pos = screenToCanvas(clientX, clientY);
      const deltaX = pos.x - dragStartCanvasPos.x;
      const deltaY = pos.y - dragStartCanvasPos.y;

      Object.entries(dragInitialPositions).forEach(([id, initPos]) => {
        updateNode(id, {
          x: initPos.x + deltaX,
          y: initPos.y + deltaY,
        });
      });
    } else if (connectingFromId) {
      setMarqueeCurrentPos(screenToCanvas(clientX, clientY));
    }
  };

  // Pointer Up
  const handlePointerUp = (e) => {
    if (isPanning) setIsPanning(false);
    if (isSelectingMarquee) {
      setIsSelectingMarquee(false);
      setMarqueeStartPos(null);
      setMarqueeCurrentPos(null);
    }
    if (dragInitialPositions) {
      Object.keys(dragInitialPositions).forEach((id) => {
        const node = nodes.find((n) => n.id === id);
        if (node) updateNodeWithHistory(id, { x: node.x, y: node.y });
      });
      setDragInitialPositions(null);
      setDragStartCanvasPos(null);
    }
    if (connectingFromId) {
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const pos = screenToCanvas(clientX, clientY);

      const targetNode = nodes.find((n) => {
        if (n.id === connectingFromId) return false;
        const dx = Math.abs(pos.x - n.x);
        const dy = Math.abs(pos.y - n.y);
        return dx < 75 && dy < 45;
      });

      if (targetNode) {
        addConnection(connectingFromId, targetNode.id);
      } else {
        setConnectingFromId(null);
      }
      setMarqueeCurrentPos(null);
    }
  };

  // Open Context Menu relative to container element, strictly clamped within bounds
  const handleOpenNodeContextMenu = (e, nodeId) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 360;

    let relX = e.clientX - rect.left;
    let relY = e.clientY - rect.top;

    // Clamp X to fit within container
    if (relX + menuWidth > rect.width) {
      relX = rect.width - menuWidth - 16;
    }
    relX = Math.max(16, relX);

    // Clamp Y to fit within container (prevents bottom cut-off!)
    if (relY + menuHeight > rect.height) {
      relY = Math.max(16, rect.height - menuHeight - 16);
    }
    relY = Math.max(16, relY);

    setContextMenu({
      position: { x: relX, y: relY },
      nodeId,
    });
  };

  // Wheel Zoom using non-passive native listener (fixes passive preventDefault browser error)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setViewState((vs) => ({
        ...vs,
        zoom: Math.min(2.5, Math.max(0.3, vs.zoom * zoomFactor)),
      }));
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, [setViewState]);

  // Double click canvas to add new node
  const handleDoubleClick = (e) => {
    if (e.target === containerRef.current || e.target.tagName === "svg") {
      const pos = screenToCanvas(e.clientX, e.clientY);
      addNode({ text: "Nytt begrep", x: pos.x, y: pos.y });
    }
  };

  const getThemeBackgroundClass = () => {
    switch (canvasTheme) {
      case "dark":
        return "bg-slate-950 text-white";
      case "dots":
        return "bg-amber-50/40 text-slate-900";
      case "light":
      default:
        return "bg-white text-slate-900";
    }
  };

  const getDotGridColor = () => {
    return canvasTheme === "dark" ? "#334155" : "#cbd5e1";
  };

  const renderMarqueeBox = () => {
    if (!isSelectingMarquee || !marqueeStartPos || !marqueeCurrentPos) return null;

    const minX = Math.min(marqueeStartPos.x, marqueeCurrentPos.x);
    const minY = Math.min(marqueeStartPos.y, marqueeCurrentPos.y);
    const width = Math.abs(marqueeCurrentPos.x - marqueeStartPos.x);
    const height = Math.abs(marqueeCurrentPos.y - marqueeStartPos.y);

    return (
      <div
        style={{
          transform: `translate(${minX}px, ${minY}px)`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        className="absolute pointer-events-none rounded-xl border-2 border-primary bg-primary/10 shadow-xs z-30"
      />
    );
  };

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (viewportRef) viewportRef.current = el;
      }}
      onMouseDown={handlePointerDownBackground}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDownBackground}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative h-full w-full overflow-hidden select-none transition-colors duration-200 ${getThemeBackgroundClass()} ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Background dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(${getDotGridColor()} 1.5px, transparent 1.5px)`,
          backgroundSize: `${24 * viewState.zoom}px ${24 * viewState.zoom}px`,
          backgroundPosition: `${viewState.panX}px ${viewState.panY}px`,
        }}
      />

      {/* Pannable & Zoomable Canvas Center */}
      <div
        className="absolute left-1/2 top-1/2 h-0 w-0 overflow-visible transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
        }}
      >
        {/* SVG Connections Overlay */}
        <SvgConnections activeDragPos={marqueeCurrentPos} />

        {/* Marquee Selection Rectangle */}
        {renderMarqueeBox()}

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeIds.includes(node.id)}
            isEditingExternal={editingNodeId === node.id}
            onStartDrag={handleStartNodeDrag}
            onStartConnect={handleStartConnect}
            onContextMenu={handleOpenNodeContextMenu}
          />
        ))}
      </div>

      {/* Right Click Node Context Menu Popup */}
      {contextMenu && (
        <NodeContextMenu
          position={contextMenu.position}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onStartEdit={() => setEditingNodeId(contextMenu.nodeId)}
        />
      )}
    </div>
  );
}
