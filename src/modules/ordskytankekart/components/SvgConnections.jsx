import React from "react";
import { useOrdskyStore } from "../store/useOrdskyStore";
import { NODE_COLORS } from "../utils/layoutAlgorithms";

export default function SvgConnections({ activeDragPos }) {
  const session = useOrdskyStore((s) => s.getActiveSession());
  const selectedConnectionId = useOrdskyStore((s) => s.selectedConnectionId);
  const setSelectedConnectionId = useOrdskyStore((s) => s.setSelectedConnectionId);
  const deleteConnection = useOrdskyStore((s) => s.deleteConnection);
  const connectingFromId = useOrdskyStore((s) => s.connectingFromId);

  const canvasTheme = session?.canvasTheme || "light";
  const nodes = session?.nodes || [];
  const connections = session?.connections || [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Calculate dynamic node bounding half-dimensions matching DOM box sizes
  const getNodeHalfBounds = (node) => {
    const fontSize = (node.isRoot ? 15 : 12) + (node.weight || 5) * 1.2;
    const textLen = node.text?.length || 6;
    const textWidth = textLen * fontSize * 0.62;
    const width = Math.max(90, textWidth + 32 + (node.shape === "capsule" ? 20 : 0));
    const height = Math.max(34, fontSize * 1.3 + 14);
    return { halfW: width / 2, halfH: height / 2 };
  };

  // Perpendicular Bezier curve calculation with exact border docking and correct arrow orientation
  const calculateDockedPoints = (fromNode, toNode) => {
    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const srcBounds = getNodeHalfBounds(fromNode);
    const tgtBounds = getNodeHalfBounds(toNode);

    let startX = x1;
    let startY = y1;
    let endX = x2;
    let endY = y2;
    let cx1 = x1;
    let cy1 = y1;
    let cx2 = x2;
    let cy2 = y2;

    const isVertical = Math.abs(dy) > Math.abs(dx);

    if (isVertical) {
      if (dy < 0) {
        // Line coming from BELOW going UPWARDS -> Enter bottom edge of target box
        startY = y1 - srcBounds.halfH - 2;
        endY = y2 + tgtBounds.halfH + 12; // Clearance for arrow head
        startX = x1;
        endX = x2;

        const gapY = Math.abs(startY - endY);
        const offset = Math.min(gapY * 0.4, 60);

        cx1 = startX;
        cy1 = startY - offset;
        cx2 = endX;
        cy2 = endY + offset;
      } else {
        // Line coming from ABOVE going DOWNWARDS -> Enter top edge of target box
        startY = y1 + srcBounds.halfH + 2;
        endY = y2 - tgtBounds.halfH - 12;
        startX = x1;
        endX = x2;

        const gapY = Math.abs(endY - startY);
        const offset = Math.min(gapY * 0.4, 60);

        cx1 = startX;
        cy1 = startY + offset;
        cx2 = endX;
        cy2 = endY - offset;
      }
    } else {
      if (dx > 0) {
        // Line coming from LEFT going RIGHTWARDS -> Enter left edge of target box
        startX = x1 + srcBounds.halfW + 2;
        endX = x2 - tgtBounds.halfW - 12;
        startY = y1;
        endY = y2;

        const gapX = Math.abs(endX - startX);
        const offset = Math.min(gapX * 0.4, 60);

        cx1 = startX + offset;
        cy1 = startY;
        cx2 = endX - offset;
        cy2 = endY;
      } else {
        // Line coming from RIGHT going LEFTWARDS -> Enter right edge of target box
        startX = x1 - srcBounds.halfW - 2;
        endX = x2 + tgtBounds.halfW + 12;
        startY = y1;
        endY = y2;

        const gapX = Math.abs(startX - endX);
        const offset = Math.min(gapX * 0.4, 60);

        cx1 = startX - offset;
        cy1 = startY;
        cx2 = endX + offset;
        cy2 = endY;
      }
    }

    const pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return { pathD, startX, startY, endX, endY, midX, midY };
  };

  // Render connection line
  const renderConnection = (conn) => {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);

    if (!fromNode || !toNode) return null;

    const isSelected = selectedConnectionId === conn.id;
    const { pathD, midX, midY } = calculateDockedPoints(fromNode, toNode);

    const colorKey = toNode.color !== "primary" ? toNode.color : fromNode.color;
    const strokeColor = conn.color || NODE_COLORS[colorKey]?.stroke || "#4f46e5";

    return (
      <g
        key={conn.id}
        className="group cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedConnectionId(conn.id);
        }}
      >
        {/* Wide hit area */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={28}
          className="cursor-pointer"
        />

        {/* Contrast background outline */}
        <path
          d={pathD}
          fill="none"
          stroke={canvasTheme === "dark" ? "#0f172a" : "#ffffff"}
          strokeWidth={isSelected ? 7 : 5}
          strokeLinecap="round"
        />

        {/* Selection glow */}
        {isSelected && (
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={9}
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        )}

        {/* Main visible connection line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isSelected ? 4 : 3}
          strokeLinecap="round"
          markerEnd={conn.arrow !== "none" ? `url(#arrow-${colorKey || "primary"})` : undefined}
          className="transition-all duration-150 group-hover:stroke-primary group-hover:stroke-[4px]"
        />

        {/* Connection Label */}
        {conn.label && (
          <g transform={`translate(${midX}, ${midY})`}>
            <rect
              x={-conn.label.length * 4 - 8}
              y={-12}
              width={conn.label.length * 8 + 16}
              height={22}
              rx={6}
              fill={canvasTheme === "dark" ? "#1e293b" : "#ffffff"}
              stroke={strokeColor}
              strokeWidth={1.5}
              className="shadow-xs"
            />
            <text
              x={0}
              y={3}
              textAnchor="middle"
              fill={canvasTheme === "dark" ? "#f8fafc" : "#1e293b"}
              fontSize={11}
              fontWeight={600}
              className="pointer-events-none select-none font-heading"
            >
              {conn.label}
            </text>
          </g>
        )}

        {/* Delete handle */}
        {isSelected && (
          <g
            transform={`translate(${midX}, ${midY - (conn.label ? 24 : 0)})`}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              deleteConnection(conn.id);
            }}
          >
            <circle r={11} fill="#ef4444" className="shadow-sm hover:scale-110 transition-transform" />
            <text x={0} y={4} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight="bold">
              ✕
            </text>
          </g>
        )}
      </g>
    );
  };

  // Active drag connection
  const renderActiveDragLine = () => {
    if (!connectingFromId || !activeDragPos) return null;
    const fromNode = nodeMap.get(connectingFromId);
    if (!fromNode) return null;

    const dx = activeDragPos.x - fromNode.x;
    const dy = activeDragPos.y - fromNode.y;
    const angle = Math.atan2(dy, dx);
    const startX = fromNode.x + Math.cos(angle) * 45;
    const startY = fromNode.y + Math.sin(angle) * 25;

    const pathD = `M ${startX} ${startY} C ${(startX + activeDragPos.x) / 2} ${startY}, ${(startX + activeDragPos.x) / 2} ${activeDragPos.y}, ${activeDragPos.x} ${activeDragPos.y}`;

    return (
      <g className="pointer-events-none">
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={4}
          strokeDasharray="6 4"
          markerEnd="url(#arrow-primary)"
          className="animate-pulse"
        />
        <circle cx={activeDragPos.x} cy={activeDragPos.y} r={7} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
      </g>
    );
  };

  return (
    <svg
      className="absolute -top-[5000px] -left-[5000px] w-[10000px] h-[10000px] pointer-events-none overflow-visible z-0"
      viewBox="-5000 -5000 10000 10000"
    >
      <defs>
        {Object.entries(NODE_COLORS).map(([key, val]) => (
          <marker
            key={key}
            id={`arrow-${key}`}
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <path d="M 1 2 L 11 6 L 1 10 z" fill={val.stroke} />
          </marker>
        ))}
      </defs>

      {/* Render all existing connections */}
      {connections.map(renderConnection)}

      {/* Render live drag connection */}
      {renderActiveDragLine()}
    </svg>
  );
}
