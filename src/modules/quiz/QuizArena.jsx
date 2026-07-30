import { useState } from "react";
import QuizList from "./QuizList";
import QuizEditor from "./QuizEditor";
import QuizPlayer from "./QuizPlayer";

function QuizArena() {
  const [view, setView] = useState({ mode: "list" });

  if (view.mode === "edit") {
    return (
      <QuizEditor
        quizId={view.quizId}
        onDone={() => setView({ mode: "list" })}
      />
    );
  }

  if (view.mode === "play") {
    return (
      <QuizPlayer
        quizId={view.quizId}
        onDone={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <QuizList
      onEdit={(quizId) => setView({ mode: "edit", quizId })}
      onPlay={(quizId) => setView({ mode: "play", quizId })}
    />
  );
}

export default QuizArena;
