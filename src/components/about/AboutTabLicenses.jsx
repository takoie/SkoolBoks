import { Code2 } from "lucide-react";

export default function AboutTabLicenses({ LICENSES }) {
  return (
    <div className="flex flex-col gap-6 font-body">
      {LICENSES.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-ink/50">
            {group.category}
          </h3>
          <div className="grid gap-3">
            {group.items.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-1 rounded-xl border border-ink/10 bg-canvas/50 p-3.5 transition-colors hover:border-ink/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 size={16} className="text-primary shrink-0" aria-hidden="true" />
                    <span className="font-heading font-bold text-ink">{item.name}</span>
                    <span className="text-xs text-ink/50">{item.version}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 font-heading text-xs font-semibold text-primary">
                    {item.license}
                  </span>
                </div>
                <p className="text-xs text-ink/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
