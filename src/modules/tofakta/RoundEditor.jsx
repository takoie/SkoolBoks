import { Trash2 } from "lucide-react";
import StatementField from "./StatementField";

function RoundEditor({ round, index, onUpdateStatement, onSetLieIndex, onUpdateHeading, onDelete, canDelete }) {
  return (
    <div className="rounded-xl2 border-2 border-ink/10 bg-background p-5 shadow-clay">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="shrink-0 font-heading text-xl font-semibold text-ink">
          Runde {index + 1}
        </h3>
        <input
          value={round.heading ?? ""}
          onChange={(e) => onUpdateHeading(e.target.value)}
          placeholder="Overskrift (valgfritt)"
          className="min-w-0 flex-1 rounded-xl2 border-2 border-transparent bg-transparent px-2 py-1 font-body text-lg text-ink/70 outline-none transition-colors focus:border-primary/40 focus:bg-surface"
        />
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`Slett runde ${index + 1}`}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {round.statements.map((statement, i) => (
          <StatementField
            key={statement.id}
            statement={statement}
            isLie={round.lieIndex === i}
            onChangeText={(text) => onUpdateStatement(i, { text })}
            onSetLie={() => onSetLieIndex(i)}
            onImageChange={(imagePath) => onUpdateStatement(i, { imagePath })}
          />
        ))}
      </div>
    </div>
  );
}

export default RoundEditor;
