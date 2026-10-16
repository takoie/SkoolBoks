import { useState } from "react";
import { Lock, KeyRound, X } from "lucide-react";

export default function PasswordModal({ mode = "unlock", onConfirm, onClose, title = "Låst notat" }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "set") {
      if (!password) {
        setError("Vennligst skriv inn et passord");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passordene samsvarer ikke");
        return;
      }
      onConfirm(password);
    } else {
      if (!password) {
        setError("Vennligst skriv inn passordet");
        return;
      }
      const success = onConfirm(password);
      if (success === false) {
        setError("Feil passord. Prøv igjen.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border-2 border-border-subtle bg-surface p-6 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {mode === "set" ? <KeyRound size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-ink">
                {mode === "set" ? "Beskytt med passord" : title}
              </h3>
              <p className="font-body text-xs text-ink-muted">
                {mode === "set"
                  ? "Angi et passord for å skjule innholdet i dette notatet"
                  : "Skriv inn passordet for å låse opp notatet"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label="Lukk"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-body">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Skriv passord..."
              autoFocus
              className="w-full rounded-xl border border-border-subtle bg-canvas px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          {mode === "set" && (
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Bekreft passord
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Bekreft passord..."
                className="w-full rounded-xl border border-border-subtle bg-canvas px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-canvas hover:text-ink"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-contrast shadow-sm hover:bg-primary-hover active:scale-95"
            >
              {mode === "set" ? "Lagre passord" : "Lås opp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
