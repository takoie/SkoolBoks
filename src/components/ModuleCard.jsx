function ModuleCard({ icon: Icon, title, description, accent = "primary", onClick }) {
  const accentClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    lime: "bg-accent-lime text-ink",
    peach: "bg-accent-peach text-ink",
    coral: "bg-accent-coral text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[180px] cursor-pointer flex-col items-start gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-6 text-left shadow-clay transition-transform duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 focus-visible:-translate-y-1"
    >
      <span
        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${accentClasses[accent]}`}
      >
        <Icon size={28} strokeWidth={2} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-heading text-2xl font-semibold text-ink">
          {title}
        </span>
        <span className="mt-1 block text-base text-ink/70">{description}</span>
      </span>
    </button>
  );
}

export default ModuleCard;
