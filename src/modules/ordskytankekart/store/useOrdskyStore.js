import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "../../../store/tauriStorage";

const DEFAULT_SESSION_ID = "default-session";
const COLOR_KEYS = ["sky", "emerald", "amber", "violet", "rose", "teal", "fuchsia", "primary"];
const DEFAULT_CATEGORIES = ["Naturfag", "Norsk", "Samfunnsfag", "Engelsk", "Kroppsøving", "Matematikk", "Generelt"];

const createBlankSession = (title = "Nytt tankekart", category = "Generelt") => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  title: title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: category,
  layoutMode: "free",
  viewState: { zoom: 1, panX: 0, panY: 0 },
  canvasTheme: "light",
  tagColors: {},
  nodes: [],
  connections: [],
});

export const useOrdskyStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      activeTab: "overview",
      categories: DEFAULT_CATEGORIES,
      selectedNodeIds: [],
      selectedConnectionId: null,
      connectingFromId: null,
      editingNodeId: null,

      historyStack: [],
      redoStack: [],

      setActiveTab: (tab) => set({ activeTab: tab }),
      setEditingNodeId: (id) => set({ editingNodeId: id }),

      addCategory: (categoryName) => {
        const trimmed = categoryName?.trim();
        if (!trimmed) return;
        const { categories } = get();
        if (categories.includes(trimmed)) return;
        set({ categories: [...categories, trimmed] });
      },

      deleteCategory: (categoryName) => {
        const { categories, sessions } = get();
        const updatedCategories = categories.filter((c) => c !== categoryName);
        const updatedSessions = sessions.map((s) =>
          s.category === categoryName ? { ...s, category: "Generelt" } : s
        );
        set({ categories: updatedCategories, sessions: updatedSessions });
      },

      // Tag & Theme management per session
      setNodeTag: (nodeId, tag) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, tag } : n)),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        });
      },

      setTagColor: (tagName, colorKey) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  tagColors: { ...(s.tagColors || {}), [tagName]: colorKey },
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        });
      },

      deleteTag: (tagName) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) => {
            if (s.id !== activeSessionId) return s;
            const newTagColors = { ...(s.tagColors || {}) };
            delete newTagColors[tagName];
            return {
              ...s,
              tagColors: newTagColors,
              nodes: s.nodes.map((n) => (n.tag === tagName ? { ...n, tag: undefined } : n)),
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      pushHistory: () => {
        const { sessions, activeSessionId, historyStack } = get();
        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (!activeSession) return;

        const snapshot = JSON.parse(JSON.stringify(activeSession));
        set({
          historyStack: [...historyStack.slice(-20), snapshot],
          redoStack: [],
        });
      },

      undo: () => {
        const { sessions, activeSessionId, historyStack, redoStack } = get();
        if (historyStack.length === 0) return;

        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (!activeSession) return;

        const currentSnapshot = JSON.parse(JSON.stringify(activeSession));
        const previousSnapshot = historyStack[historyStack.length - 1];

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? { ...previousSnapshot, updatedAt: new Date().toISOString() }
              : s
          ),
          historyStack: historyStack.slice(0, -1),
          redoStack: [...redoStack, currentSnapshot],
        });
      },

      redo: () => {
        const { sessions, activeSessionId, historyStack, redoStack } = get();
        if (redoStack.length === 0) return;

        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (!activeSession) return;

        const currentSnapshot = JSON.parse(JSON.stringify(activeSession));
        const nextSnapshot = redoStack[redoStack.length - 1];

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? { ...nextSnapshot, updatedAt: new Date().toISOString() }
              : s
          ),
          historyStack: [...historyStack, currentSnapshot],
          redoStack: redoStack.slice(0, -1),
        });
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || sessions[0];
      },

      createSession: (title = "Nytt tankekart", category = "Naturfag") => {
        const newId = `session-${Date.now()}`;
        const newSession = {
          id: newId,
          title,
          category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          layoutMode: "free",
          canvasTheme: "light",
          tagColors: {},
          viewState: { zoom: 1, panX: 0, panY: 0 },
          nodes: [
            {
              id: `node-root-${Date.now()}`,
              text: title,
              x: 0,
              y: 0,
              weight: 8,
              color: "primary",
              shape: "rounded",
              isRoot: true,
            },
          ],
          connections: [],
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newId,
          activeTab: "tavle",
          selectedNodeIds: [],
          selectedConnectionId: null,
          historyStack: [],
          redoStack: [],
        }));
      },

      switchSession: (id) => {
        set({
          activeSessionId: id,
          activeTab: "tavle",
          selectedNodeIds: [],
          selectedConnectionId: null,
          historyStack: [],
          redoStack: [],
        });
      },

      updateSessionTitle: (title) => {
        get().pushHistory();
        const { activeSessionId } = get();
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId
              ? { ...s, title, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      deleteSession: (id) => {
        const { sessions, activeSessionId } = get();
        const remaining = sessions.filter((s) => s.id !== id);
        set({
          sessions: remaining,
          activeSessionId: remaining.length > 0 ? (activeSessionId === id ? remaining[0].id : activeSessionId) : null,
          selectedNodeIds: [],
          selectedConnectionId: null,
        });
      },

      duplicateSession: (id) => {
        const { sessions } = get();
        const target = sessions.find((s) => s.id === id);
        if (!target) return;

        const copyId = `session-${Date.now()}`;
        const copy = {
          ...JSON.parse(JSON.stringify(target)),
          id: copyId,
          title: `${target.title} (Kopi)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          sessions: [copy, ...sessions],
          activeSessionId: copyId,
          activeTab: "tavle",
        });
      },

      setCanvasTheme: (theme) => {
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId ? { ...s, canvasTheme: theme } : s
          ),
        });
      },

      setViewState: (updater) => {
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) => {
            if (s.id !== activeSessionId) return s;
            const newViewState = typeof updater === "function" ? updater(s.viewState) : updater;
            return { ...s, viewState: newViewState };
          }),
        });
      },

      addNode: (nodeData) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        const newNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: nodeData.text || "Nytt begrep",
          x: nodeData.x ?? 0,
          y: nodeData.y ?? 0,
          weight: nodeData.weight ?? 5,
          color: nodeData.color || "primary",
          shape: nodeData.shape || "rounded",
          tag: nodeData.tag || "",
          notes: nodeData.notes || "",
        };

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: [...s.nodes, newNode],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          selectedNodeIds: [newNode.id],
          editingNodeId: newNode.id,
        });
        return newNode.id;
      },

      updateNode: (id, updates) => {
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        });
      },

      updateNodeWithHistory: (id, updates) => {
        get().pushHistory();
        get().updateNode(id, updates);
      },

      deleteNode: (id) => {
        get().pushHistory();
        const { activeSessionId, sessions, selectedNodeIds } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: s.nodes.filter((n) => n.id !== id),
                  connections: s.connections.filter(
                    (c) => c.fromNodeId !== id && c.toNodeId !== id
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          selectedNodeIds: selectedNodeIds.filter((nodeId) => nodeId !== id),
        });
      },

      deleteSelected: () => {
        const { selectedNodeIds, selectedConnectionId } = get();
        if (selectedNodeIds.length > 0) {
          get().pushHistory();
          selectedNodeIds.forEach((id) => get().deleteNode(id));
          set({ selectedNodeIds: [] });
        } else if (selectedConnectionId) {
          get().deleteConnection(selectedConnectionId);
        }
      },

      addChildNode: (parentId) => {
        const { activeSessionId, sessions } = get();
        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (!activeSession) return;

        const parentNode = activeSession.nodes.find((n) => n.id === parentId);
        if (!parentNode) return;

        get().pushHistory();

        // Pick an unused color
        const usedColors = new Set(activeSession.nodes.map((n) => n.color));
        const unusedColors = COLOR_KEYS.filter((c) => !usedColors.has(c));

        let childColor = "";
        if (unusedColors.length > 0) {
          childColor = unusedColors[0];
        } else {
          const counts = {};
          COLOR_KEYS.forEach((c) => (counts[c] = 0));
          activeSession.nodes.forEach((n) => {
            if (counts[n.color] !== undefined) counts[n.color] += 1;
          });
          childColor = COLOR_KEYS.reduce((a, b) => (counts[a] <= counts[b] ? a : b));
        }

        const childConns = activeSession.connections.filter((c) => c.fromNodeId === parentId);
        const childCount = childConns.length;
        const baseDistance = 190;

        let newX = parentNode.x;
        let newY = parentNode.y;

        if (parentNode.isRoot) {
          const side = childCount % 2 === 0 ? 1 : -1;
          const row = Math.floor(childCount / 2);
          newX = parentNode.x + side * (baseDistance + row * 40);
          newY = parentNode.y + (row % 2 === 0 ? 110 : -110);
        } else {
          const angle = (childCount * 35 - 15) * (Math.PI / 180);
          newX = parentNode.x + Math.cos(angle) * baseDistance;
          newY = parentNode.y + Math.sin(angle) * baseDistance;
        }

        const newId = `node-${Date.now()}`;
        const newNode = {
          id: newId,
          text: "Ny undernode",
          x: Math.round(newX),
          y: Math.round(newY),
          weight: Math.max(3, (parentNode.weight || 5) - 1),
          color: childColor,
          shape: "rounded",
          tag: parentNode.tag || "",
        };

        const newConnection = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fromNodeId: parentId,
          toNodeId: newId,
          style: "bezier",
          arrow: "forward",
        };

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: [...s.nodes, newNode],
                  connections: [...s.connections, newConnection],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          selectedNodeIds: [newId],
          editingNodeId: newId,
        });
      },

      setConnectingFromId: (id) => set({ connectingFromId: id }),

      addConnection: (fromNodeId, toNodeId, label = "") => {
        if (fromNodeId === toNodeId) return;
        const { activeSessionId, sessions } = get();
        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (!activeSession) return;

        const exists = activeSession.connections.some(
          (c) =>
            (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) ||
            (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
        );
        if (exists) return;

        get().pushHistory();
        const newConn = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fromNodeId,
          toNodeId,
          label,
          style: "bezier",
          arrow: "forward",
        };

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  connections: [...s.connections, newConn],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          connectingFromId: null,
          selectedConnectionId: newConn.id,
        });
      },

      updateConnection: (id, updates) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  connections: s.connections.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        });
      },

      deleteConnection: (id) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  connections: s.connections.filter((c) => c.id !== id),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          selectedConnectionId: null,
        });
      },

      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids, selectedConnectionId: null }),
      setSelectedConnectionId: (id) => set({ selectedConnectionId: id, selectedNodeIds: [] }),
      clearSelection: () => set({ selectedNodeIds: [], selectedConnectionId: null }),

      importNodesAndLayout: (newNodes, layoutMode = "cloud", connections = []) => {
        get().pushHistory();
        const { activeSessionId, sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: newNodes,
                  connections,
                  layoutMode,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          activeTab: "tavle",
          selectedNodeIds: [],
          selectedConnectionId: null,
        });
      },

      applyLayout: (layoutFn, modeName) => {
        const { activeSessionId, sessions } = get();
        const session = sessions.find((s) => s.id === activeSessionId);
        if (!session) return;

        get().pushHistory();
        const updatedNodes = layoutFn(session.nodes, session.connections);

        set({
          sessions: sessions.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  nodes: updatedNodes,
                  layoutMode: modeName,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        });
      },
    }),
    {
      name: "skoolbox-ordsky-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        categories: state.categories,
      }),
    }
  )
);
