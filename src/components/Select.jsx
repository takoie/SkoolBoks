import { useEffect, useRef, useState, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

function Select({ value, onChange, options, ariaLabel, className = "", panelClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const idPrefix = useId();
  const listboxId = `${idPrefix}-listbox`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);

    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, selectedIndex]);

  function handleKeyDown(e) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setOpen(false);
          buttonRef.current?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    if (open && listRef.current && focusedIndex >= 0) {
      const optionEl = listRef.current.children[focusedIndex];
      optionEl?.scrollIntoView?.({ block: "nearest" });
    }
  }, [focusedIndex, open]);

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
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
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`animate-fade-in absolute left-0 top-full z-50 mt-2 max-h-72 min-w-full overflow-auto rounded-xl2 border-2 border-border-subtle bg-surface p-1.5 shadow-clay ${panelClassName}`}
        >
          {options.map((o, idx) => {
            const isSelected = o.value === value;
            const isFocused = idx === focusedIndex;
            const optionId = `${idPrefix}-opt-${idx}`;

            return (
              <li
                key={o.value}
                id={optionId}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-body text-base transition-colors ${
                  isFocused
                    ? "bg-primary/20 text-primary font-semibold outline-none ring-2 ring-primary"
                    : isSelected
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-ink hover:bg-primary/10"
                }`}
              >
                {o.label}
                {isSelected && <Check size={18} aria-hidden="true" className="shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
