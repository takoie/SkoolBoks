import { Trophy } from "lucide-react";
import { getGroupTotal, getMarkDelta } from "../../lib/stiansGame";

function formatLiveCell(prevPoints, mark, pointsPerRound) {
  if (mark === undefined) return String(prevPoints);
  const delta = getMarkDelta(pointsPerRound, mark);
  if (delta === 0) return String(prevPoints);
  const sign = delta > 0 ? "+" : "";
  return `${prevPoints}${sign}${delta}`;
}

export default function StiansScoreBoard({
  groups,
  categories,
  scores,
  review,
  pointsPerRound,
  bonusEnabled,
  reviewingGroupId,
}) {
  const reviewedCategory = review ? categories[review.categoryIndex] : null;

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="w-full overflow-hidden rounded-xl2 border-2 border-ink/10 shadow-clay">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary/10">
              <th
                scope="col"
                className="border-2 border-ink/10 px-4 py-3 text-left font-heading text-lg text-ink"
              >
                Gruppe
              </th>
              {categories.map((cat) => (
                <th
                  key={cat}
                  scope="col"
                  className={`border-2 border-ink/10 px-4 py-3 text-left font-heading text-base text-ink transition-colors ${
                    cat === reviewedCategory ? "bg-primary/30" : ""
                  }`}
                >
                  {cat}
                </th>
              ))}
              {bonusEnabled && (
                <th
                  scope="col"
                  aria-label="Bonus"
                  className="border-2 border-ink/10 px-4 py-3 text-center font-heading text-lg text-ink"
                >
                  <Trophy size={20} className="mx-auto" aria-hidden="true" />
                </th>
              )}
              <th
                scope="col"
                className="border-2 border-ink/10 bg-accent-lime/30 px-4 py-3 text-left font-heading text-lg text-ink"
              >
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const entry = scores[g.id] ?? { byCategory: {}, bonus: 0 };
              const isReviewing = g.id === reviewingGroupId;
              return (
                <tr
                  key={g.id}
                  className={`transition-colors ${
                    isReviewing ? "bg-primary/10" : "bg-surface"
                  }`}
                >
                  <td
                    className={`border-2 border-ink/10 px-4 py-3 font-heading font-semibold transition-colors ${
                      isReviewing ? "text-primary" : "text-ink"
                    }`}
                  >
                    {isReviewing && "▶ "}
                    {g.name}
                  </td>
                  {categories.map((cat) => {
                    const mark = review?.marks[g.id]?.[cat];
                    return (
                      <td
                        key={cat}
                        className={`border-2 border-ink/10 px-4 py-3 font-body text-lg text-ink transition-colors ${
                          cat === reviewedCategory ? "bg-primary/10" : ""
                        }`}
                      >
                        {formatLiveCell(
                          entry.byCategory[cat] ?? 0,
                          mark,
                          pointsPerRound
                        )}
                      </td>
                    );
                  })}
                  {bonusEnabled && (
                    <td className="border-2 border-ink/10 px-4 py-3 text-center font-body text-lg text-ink">
                      {entry.bonus}
                    </td>
                  )}
                  <td className="border-2 border-ink/10 bg-accent-lime/10 px-4 py-3 font-heading text-lg font-bold text-ink">
                    {getGroupTotal(scores, g.id)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
