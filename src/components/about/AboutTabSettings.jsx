import { CheckCircle2, LockKeyhole } from "lucide-react";

export default function AboutTabSettings({
  securitySettings,
  enablePinCode,
  disablePinCode,
  lockApp,
  onClose,
  pinInput,
  setPinInput,
  pinFeedback,
  setPinFeedback,
}) {
  return (
    <div className="flex flex-col gap-6 font-body text-ink/80 text-sm">
      {/* Disk Encryption Status */}
      <div className="rounded-xl border border-accent-teal/30 bg-accent-teal/10 p-4 text-ink">
        <div className="flex items-center gap-2.5 font-heading text-base font-bold text-accent-teal-ink mb-1">
          <CheckCircle2 size={20} aria-hidden="true" />
          Automatisk lokal disk-kryptering er aktiv
        </div>
        <p className="text-sm leading-relaxed text-ink/80">
          Alle elevnavn, klasser og datatilstander blir automatisk kryptert før de skrives til disken på din datamaskin. Åpnes JSON-filen på disken eller kopieres til en minnepenn, inneholder den kun uleselig kryptert data.
        </p>
      </div>

      {/* PIN Protection Setting */}
      <div className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-canvas/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole size={20} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-ink">
                PIN-kode ved oppstart
              </h3>
              <p className="text-xs text-ink/60">
                Krever at du taster en 4-sifret PIN-kode når appen åpnes (nyttig på delte klasseroms-PCer).
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4">
          {securitySettings?.pinEnabled ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-green-ink">
                <CheckCircle2 size={16} />
                PIN-beskyttelse er aktivert
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    disablePinCode();
                    setPinFeedback("PIN-kode er nå slått av.");
                  }}
                  className="cursor-pointer rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 font-heading text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  Slå av PIN-kode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockApp();
                  }}
                  className="cursor-pointer rounded-xl border border-primary bg-primary px-4 py-2 font-heading text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
                >
                  Lås appen nå
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-ink/70">
                Sett opp ny 4-sifret PIN-kode:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="F.eks. 1234"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ""));
                    setPinFeedback("");
                  }}
                  className="w-32 rounded-xl border-2 border-ink/20 bg-surface px-3 py-1.5 font-heading text-base font-bold text-ink focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) {
                      setPinFeedback("PIN-koden må bestå av minst 4 siffer.");
                      return;
                    }
                    enablePinCode(pinInput);
                    setPinInput("");
                    setPinFeedback("PIN-kode er aktivert!");
                  }}
                  className="cursor-pointer rounded-xl border border-primary bg-primary px-4 py-2 font-heading text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
                >
                  Aktiver PIN
                </button>
              </div>
            </div>
          )}

          {pinFeedback && (
            <p className="mt-2 text-xs font-semibold text-primary">
              {pinFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
