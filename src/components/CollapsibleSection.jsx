import { useState } from "react";
import { ChevronDown } from "lucide-react";

function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl2 border-2 border-ink/10 bg-surface p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between font-heading text-xl font-semibold text-ink"
      >
        {title}
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

export default CollapsibleSection;
