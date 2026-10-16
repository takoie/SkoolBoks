export default function AboutTabInfo() {
  return (
    <div className="flex flex-col gap-5 font-body text-base text-ink/80">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="leading-relaxed">
          <strong>SkoolBoks</strong> er laget for å samle nyttige verktøy, aktiviteter og
          undervisningsopplegg på ett og samme sted, slik at alt du trenger i klasserommet
          er raskt og enkelt tilgjengelig på tavla eller skrivebordet.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-semibold text-ink">Utvikler</p>
        <p>Designet og utviklet av Stian Taknæs.</p>
        <p className="text-sm">
          Har du forslag til nye moduler, tilbakemeldinger eller ris/ros? Send gjerne en e-post til{" "}
          <a
            href="mailto:stian@taknes.no"
            className="font-semibold text-primary underline hover:text-primary-active"
          >
            stian@taknes.no
          </a>
          .
        </p>
      </div>
    </div>
  );
}
