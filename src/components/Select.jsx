import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

function Select({ value, onChange, options, ariaLabel, className = "", panelClassName = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center justify-between gap-2 ${className}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`animate-fade-in absolute left-0 top-full z-50 mt-2 max-h-72 min-w-full overflow-auto rounded-xl2 border-2 border-ink/10 bg-surface p-1.5 shadow-clay ${panelClassName}`}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-xl2 px-3 py-2 text-left font-body text-base transition-colors ${
                  o.value === value
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                {o.label}
                {o.value === value && <Check size={16} aria-hidden="true" className="shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Select;
