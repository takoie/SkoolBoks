import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { getCurrentReviewGroupId } from "../lib/stiansGame";

import StiansGameHome from "./stiansgame/StiansGameHome";
import StiansScoreBoard from "./stiansgame/StiansScoreBoard";
import StiansSetup from "./stiansgame/StiansSetup";
import StiansIdle from "./stiansgame/StiansIdle";
import StiansWriting from "./stiansgame/StiansWriting";
import StiansReview from "./stiansgame/StiansReview";

function StiansGame() {
  const [view, setView] = useState("home");
  const phase = useAppStore((s) => s.stiansGame.phase);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const scores = useAppStore((s) => s.stiansGame.scores);
  const review = useAppStore((s) => s.stiansGame.review);
  const pointsPerRound = useAppStore((s) => s.stiansGame.pointsPerRound);
  const bonusEnabled = useAppStore((s) => s.stiansGame.bonusEnabled);
  const reviewingGroupId = review
    ? getCurrentReviewGroupId({ review, categories })
    : null;

  if (view === "home") {
    return <StiansGameHome onEnterGame={() => setView("game")} />;
  }

  const backButton = (
    <button
      type="button"
      onClick={() => setView("home")}
      className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      Tilbake til oversikt
    </button>
  );

  return (
    <div className="w-full">
      {phase === "setup" ? (
        <>
          <div className="mb-4">{backButton}</div>
          <StiansSetup />
        </>
      ) : (
        <>
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute left-0">{backButton}</div>
            <h2 className="font-heading text-3xl font-semibold text-ink">
              Stians game
            </h2>
          </div>
          <StiansScoreBoard
            groups={groups}
            categories={categories}
            scores={scores}
            review={review}
            pointsPerRound={pointsPerRound}
            bonusEnabled={bonusEnabled}
            reviewingGroupId={reviewingGroupId}
          />
          {phase === "idle" && <StiansIdle />}
          {phase === "writing" && <StiansWriting />}
          {phase === "reviewing" && <StiansReview />}
        </>
      )}
    </div>
  );
}

export default StiansGame;
