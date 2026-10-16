import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, AlertCircle, HelpCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export default function PinUnlockModal() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  
  const unlockApp = useAppStore((s) => s.unlockApp);
  const disablePinCode = useAppStore((s) => s.disablePinCode);

  function handleUnlock(e) {
    e?.preventDefault();
    if (!pin) return;
    const success = unlockApp(pin);
    if (!success) {
      setError(true);
      setPin("");
    } else {
      setError(false);
    }
  }

  function handleDigitClick(digit) {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length >= 4) {
        // Auto-check if 4 digits entered
        const success = unlockApp(nextPin);
        if (!success && nextPin.length === 4) {
          // If failure on 4 digits, show error after small delay
          setTimeout(() => {
            setError(true);
            setPin("");
          }, 150);
        }
      }
    }
  }

  function handleResetPin() {
    disablePinCode();
    setShowForgotConfirm(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-2xl animate-modal-in border-2 border-primary/20">
        {!showForgotConfirm ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Lock size={32} />
            </div>

            <h2 className="font-heading text-2xl font-bold text-ink">
              SkoolBoks er låst
            </h2>
            <p className="mt-1 font-body text-sm text-ink/70">
              Skriv inn PIN-koden din for å låse opp
            </p>

            {/* PIN Dots indicator */}
            <div className="my-6 flex items-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
                    pin.length > idx
                      ? "border-primary bg-primary scale-110"
                      : "border-ink/30 bg-canvas"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive animate-bounce">
                <AlertCircle size={16} />
                Feil PIN-kode. Prøv igjen.
              </div>
            )}

            <form onSubmit={handleUnlock} className="w-full">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="****"
                className="sr-only"
                autoFocus
              />

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitClick(digit)}
                    className="flex h-14 items-center justify-center rounded-2xl border border-ink/10 bg-canvas font-heading text-xl font-bold text-ink shadow-sm transition-all hover:bg-primary/10 hover:border-primary/40 active:scale-95 cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPin("");
                    setError(false);
                  }}
                  className="flex h-14 items-center justify-center rounded-2xl border border-ink/10 bg-canvas font-heading text-xs font-semibold text-ink/60 hover:bg-ink/5 cursor-pointer"
                >
                  Slett
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick("0")}
                  className="flex h-14 items-center justify-center rounded-2xl border border-ink/10 bg-canvas font-heading text-xl font-bold text-ink shadow-sm transition-all hover:bg-primary/10 hover:border-primary/40 active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="submit"
                  disabled={!pin}
                  className="flex h-14 items-center justify-center rounded-2xl border border-primary bg-primary font-heading text-sm font-bold text-white shadow-clay transition-all hover:bg-primary-hover disabled:opacity-40 cursor-pointer"
                >
                  Lås opp
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setShowForgotConfirm(true)}
              className="mt-6 flex items-center gap-1.5 text-xs font-heading font-semibold text-ink/60 hover:text-primary transition-colors cursor-pointer"
            >
              <HelpCircle size={15} />
              <span>Glemt PIN-kode?</span>
            </button>
          </>
        ) : (
          /* Reset Confirmation View */
          <div className="space-y-4 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert size={32} />
            </div>

            <h2 className="font-heading text-xl font-bold text-ink">
              Glemt PIN-kode?
            </h2>

            <p className="text-xs text-ink/70 leading-relaxed">
              Dette vil fjerne PIN-kodelåsen på denne enheten slik at du får tilgang til SkoolBoks igjen.
              Du kan sette opp ny PIN-kode senere.
            </p>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleResetPin}
                className="w-full rounded-xl bg-destructive px-4 py-3 font-heading text-sm font-bold text-white shadow-sm transition-colors hover:bg-destructive/90 cursor-pointer"
              >
                Tilbakestill og lås opp
              </button>

              <button
                type="button"
                onClick={() => setShowForgotConfirm(false)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink/10 bg-canvas px-4 py-2.5 font-heading text-xs font-semibold text-ink/70 hover:bg-ink/5"
              >
                <ArrowLeft size={16} />
                Tilbake til tastatur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
