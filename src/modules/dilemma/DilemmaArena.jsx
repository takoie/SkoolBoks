import { useState } from "react";
import SessionList from "./SessionList";
import SessionEditor from "./SessionEditor";
import PresentationView from "./PresentationView";

function DilemmaArena() {
  const [view, setView] = useState({ mode: "list" });

  if (view.mode === "editor" && view.sessionId) {
    return (
      <SessionEditor
        sessionId={view.sessionId}
        onBack={() => setView({ mode: "list" })}
        onPresent={() => setView({ mode: "present", sessionId: view.sessionId })}
      />
    );
  }

  if (view.mode === "present" && view.sessionId) {
    return (
      <PresentationView
        sessionId={view.sessionId}
        onBack={() => setView({ mode: "editor", sessionId: view.sessionId })}
      />
    );
  }

  return (
    <SessionList
      onOpen={(sessionId) => setView({ mode: "editor", sessionId })}
      onPresent={(sessionId) => setView({ mode: "present", sessionId })}
    />
  );
}

export default DilemmaArena;
