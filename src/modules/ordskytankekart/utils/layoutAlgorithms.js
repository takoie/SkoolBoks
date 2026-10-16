// Color presets palette for nodes matching SkoolBox theme
export const NODE_COLORS = {
  primary: { bg: "bg-primary text-white border-primary-dark", stroke: "#4f46e5" },
  sky: { bg: "bg-sky-500 text-white border-sky-600", stroke: "#0284c7" },
  emerald: { bg: "bg-emerald-500 text-white border-emerald-600", stroke: "#059669" },
  amber: { bg: "bg-amber-400 text-slate-900 border-amber-500", stroke: "#d97706" },
  violet: { bg: "bg-violet-500 text-white border-violet-600", stroke: "#7c3aed" },
  rose: { bg: "bg-rose-500 text-white border-rose-600", stroke: "#e11d48" },
  teal: { bg: "bg-teal-500 text-white border-teal-600", stroke: "#0d9488" },
  fuchsia: { bg: "bg-fuchsia-500 text-white border-fuchsia-600", stroke: "#c026d3" },
  dark: { bg: "bg-slate-800 text-white border-slate-900", stroke: "#334155" },
  light: { bg: "bg-white text-slate-800 border-slate-300 shadow-sm", stroke: "#94a3b8" },
};

const COLOR_KEYS = ["primary", "sky", "emerald", "amber", "violet", "rose", "teal", "fuchsia"];

/**
 * Parse raw input text (lines or comma separated) into nodes with frequency weights
 */
export function parseWordList(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Split by line breaks or commas
  const items = rawText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Frequency count map
  const freqMap = new Map();
  for (const item of items) {
    const cleanKey = item.toLowerCase();
    if (freqMap.has(cleanKey)) {
      const existing = freqMap.get(cleanKey);
      existing.count += 1;
    } else {
      freqMap.set(cleanKey, { text: item, count: 1 });
    }
  }

  const entries = Array.from(freqMap.values());
  if (entries.length === 0) return [];

  const maxCount = Math.max(...entries.map((e) => e.count));
  const minCount = Math.min(...entries.map((e) => e.count));

  // Map to nodes
  return entries.map((entry, index) => {
    // Weight between 2 and 10 based on frequency
    let weight = 4;
    if (maxCount > minCount) {
      weight = Math.round(2 + ((entry.count - minCount) / (maxCount - minCount)) * 8);
    } else if (entry.count > 1) {
      weight = Math.min(10, 3 + entry.count);
    }

    const colorKey = COLOR_KEYS[index % COLOR_KEYS.length];

    return {
      id: `node-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      text: entry.text,
      x: 0,
      y: 0,
      weight,
      color: colorKey,
      shape: "rounded",
      notes: entry.count > 1 ? `Forekomster i ordlisten: ${entry.count}` : "",
    };
  });
}

/**
 * Archimedean spiral cloud layout algorithm
 */
export function layoutCloud(nodes) {
  if (!nodes || nodes.length === 0) return [];

  // Copy and sort by weight descending so biggest words are placed in center
  const sorted = [...nodes].sort((a, b) => b.weight - a.weight);
  const placed = [];

  const checkOverlap = (node, x, y, width, height) => {
    const margin = 20;
    for (const p of placed) {
      const pW = (p.text.length * 10 + 40) * (0.6 + p.weight * 0.1);
      const pH = 45 * (0.6 + p.weight * 0.1);
      const dx = Math.abs(x - p.x);
      const dy = Math.abs(y - p.y);
      if (dx < (width + pW) / 2 + margin && dy < (height + pH) / 2 + margin) {
        return true;
      }
    }
    return false;
  };

  sorted.forEach((node) => {
    const width = (node.text.length * 10 + 40) * (0.6 + node.weight * 0.1);
    const height = 45 * (0.6 + node.weight * 0.1);

    let theta = 0;
    let radius = 0;
    let placedX = 0;
    let placedY = 0;
    let found = false;

    // Spiral outward
    while (!found && radius < 2500) {
      const x = Math.round(radius * Math.cos(theta));
      const y = Math.round(radius * Math.sin(theta));

      if (!checkOverlap(node, x, y, width, height)) {
        placedX = x;
        placedY = y;
        found = true;
      } else {
        theta += 0.4;
        radius = 12 * theta;
      }
    }

    const updated = { ...node, x: placedX, y: placedY };
    placed.push(updated);
  });

  // Maintain original node order by map
  const placedMap = new Map(placed.map((n) => [n.id, n]));
  return nodes.map((n) => placedMap.get(n.id) || n);
}

/**
 * Circle layout algorithm
 */
export function layoutCircle(nodes) {
  if (!nodes || nodes.length === 0) return [];

  const count = nodes.length;
  const radius = Math.max(180, count * 35);
  const angleStep = (2 * Math.PI) / count;

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
    };
  });
}

/**
 * Grid layout algorithm
 */
export function layoutGrid(nodes) {
  if (!nodes || nodes.length === 0) return [];

  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacingX = 220;
  const spacingY = 110;

  const startX = -((cols - 1) * spacingX) / 2;
  const startY = -((Math.ceil(nodes.length / cols) - 1) * spacingY) / 2;

  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...node,
      x: Math.round(startX + col * spacingX),
      y: Math.round(startY + row * spacingY),
    };
  });
}

/**
 * Hierarchical tree layout algorithm
 */
export function layoutTree(nodes, connections = []) {
  if (!nodes || nodes.length === 0) return [];

  // Find root node or fallback to first
  const rootNode = nodes.find((n) => n.isRoot) || nodes[0];
  const childrenMap = new Map();
  connections.forEach((c) => {
    if (!childrenMap.has(c.fromNodeId)) childrenMap.set(c.fromNodeId, []);
    childrenMap.get(c.fromNodeId).push(c.toNodeId);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
  const visited = new Set();

  const positionNode = (nodeId, level, startY, availableHeight) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    node.x = level * 260;
    node.y = startY + availableHeight / 2;

    const children = (childrenMap.get(nodeId) || [])
      .map((id) => nodeMap.get(id))
      .filter(Boolean);

    if (children.length > 0) {
      const childSegment = availableHeight / children.length;
      children.forEach((child, i) => {
        positionNode(child.id, level + 1, startY + i * childSegment, childSegment);
      });
    }
  };

  const totalHeight = Math.max(500, nodes.length * 80);
  positionNode(rootNode.id, 0, -totalHeight / 2, totalHeight);

  // Position orphan nodes in a stack on the left
  let orphanOffset = -200;
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const node = nodeMap.get(n.id);
      if (node) {
        node.x = -300;
        node.y = orphanOffset;
        orphanOffset += 90;
      }
    }
  });

  return Array.from(nodeMap.values());
}
