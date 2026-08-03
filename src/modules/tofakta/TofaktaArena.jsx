import { useState } from "react";
import SessionList from "./SessionList";
import SessionEditor from "./SessionEditor";
import PresentationView from "./PresentationView";

function TofaktaArena() {
  const [view, setView] = useState({ mode: "list" });

  if (view.mode === "editor") {
    return (
      <SessionEditor
        sessionId={view.sessionId}
        onBack={() => setView({ mode: "list" })}
        onPresent={() => setView({ mode: "present", sessionId: view.sessionId })}
      />
    );
  }

  if (view.mode === "present") {
    return (
      <PresentationView
        sessionId={view.sessionId}
        onBack={() => setView({ mode: "editor", sessionId: view.sessionId })}
      />
    );
  }

  return (
    <SessionList onOpen={(sessionId) => setView({ mode: "editor", sessionId })} />
  );
}

export default TofaktaArena;
