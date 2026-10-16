import { ShieldCheck, HardDrive, CheckCircle2, Lock, ExternalLink } from "lucide-react";

export default function AboutTabPrivacy({ handleOpenLink }) {
  return (
    <div className="flex flex-col gap-5 font-body text-ink/80 text-sm">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-ink">
        <div className="flex items-center gap-2.5 font-heading text-base font-bold text-primary mb-1">
          <ShieldCheck size={20} aria-hidden="true" />
          100 % Lokal lagring — Ingen skysynkronisering
        </div>
        <p className="text-sm leading-relaxed text-ink/80">
          SkoolBoks sender <strong>ingen data ut av datamaskinen din</strong>. Alle navnelister, innstillinger og klasseromsoppsett blir lagret 100 % lokalt på din PC.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-heading text-base font-bold text-ink flex items-center gap-2">
          <HardDrive size={18} className="text-primary" aria-hidden="true" />
          Personvern i SkoolBoks
        </h3>
        <ul className="flex flex-col gap-2.5 pl-1">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Ingen sporing eller telemetri:</strong> Programmet inneholder ingen sporing, analyseverktøy eller eksterne nettverkskall.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Ingen skylagring:</strong> Elevnavn og klasselister forblir på din enhet og blir aldri overført til eksterne servere.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Fungerer offline:</strong> Alt i SkoolBoks fungerer helt uten internettilkobling.</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/10 pt-4">
        <h3 className="font-heading text-base font-bold text-ink flex items-center gap-2">
          <Lock size={18} className="text-primary" aria-hidden="true" />
          GDPR & Retningslinjer for skolen i Norge
        </h3>
        <p className="text-sm leading-relaxed text-ink/80">
          Ettersom SkoolBoks ikke behandler personopplysninger i skyen eller deler data med tredjeparter, utgjør appen ingen risiko for datalekkasje til tredjeland eller kommersielle aktører.
        </p>
        <p className="text-sm font-semibold text-ink">Offisielle retningslinjer for personvern i skolesektoren:</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => handleOpenLink("https://www.datatilsynet.no/personvern-i-ulike-sektorer/skole-barnehage/")}
            className="flex-1 flex items-center justify-between gap-2 rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-left font-heading text-xs font-semibold text-ink hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <span>Datatilsynet — Skole og barnehage</span>
            <ExternalLink size={14} className="shrink-0 text-ink/40" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenLink("https://www.udir.no/regelverk-og-tilsyn/skole-og-opplaring/personvern/")}
            className="flex-1 flex items-center justify-between gap-2 rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-left font-heading text-xs font-semibold text-ink hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <span>Utdanningsdirektoratet — Personvern</span>
            <ExternalLink size={14} className="shrink-0 text-ink/40" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
