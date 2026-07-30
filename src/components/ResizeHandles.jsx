import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

const EDGES = [
  { direction: "North", className: "top-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { direction: "South", className: "bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { direction: "West", className: "left-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { direction: "East", className: "right-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { direction: "NorthWest", className: "top-0 left-0 h-1.5 w-1.5 cursor-nwse-resize" },
  { direction: "SouthEast", className: "bottom-0 right-0 h-1.5 w-1.5 cursor-nwse-resize" },
  { direction: "NorthEast", className: "top-0 right-0 h-1.5 w-1.5 cursor-nesw-resize" },
  { direction: "SouthWest", className: "bottom-0 left-0 h-1.5 w-1.5 cursor-nesw-resize" },
];

function ResizeHandles() {
  return (
    <>
      {EDGES.map(({ direction, className }) => (
        <div
          key={direction}
          className={`fixed z-50 ${className}`}
          onMouseDown={() => appWindow.startResizeDragging(direction)}
        />
      ))}
    </>
  );
}

export default ResizeHandles;
