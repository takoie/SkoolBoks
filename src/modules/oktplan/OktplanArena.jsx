import { useState } from "react";
import OktOverview from "./OktOverview";
import OktBuilder from "./OktBuilder";
import OktRunner from "./OktRunner";
import OktPresetsModal from "./OktPresetsModal";
import { PRESET_SESSIONS } from "./oktConstants";

export default function OktplanArena() {
  const [viewMode, setViewMode] = useState("overview"); // 'overview' | 'builder' | 'runner'
  const [title, setTitle] = useState(PRESET_SESSIONS[0].title);
  const [intervals, setIntervals] = useState(PRESET_SESSIONS[0].intervals);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  function handleCreateNewSession() {
    setTitle("Ny økt");
    setIntervals([
      {
        id: crypto.randomUUID(),
        activityId: "lese",
        customTitle: "Lese",
        minutes: 10,
        seconds: 0,
      },
    ]);
    setViewMode("builder");
  }

  function handleSelectSessionToEdit(session) {
    setTitle(session.title || "Ny økt");
    setIntervals(JSON.parse(JSON.stringify(session.intervals || [])));
    setViewMode("builder");
  }

  function handleSelectSessionToRun(session) {
    setTitle(session.title || "Ny økt");
    setIntervals(JSON.parse(JSON.stringify(session.intervals || [])));
    setViewMode("runner");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {viewMode === "overview" && (
        <OktOverview
          onCreateNewSession={handleCreateNewSession}
          onSelectSessionToEdit={handleSelectSessionToEdit}
          onSelectSessionToRun={handleSelectSessionToRun}
        />
      )}

      {viewMode === "builder" && (
        <OktBuilder
          title={title}
          setTitle={setTitle}
          intervals={intervals}
          setIntervals={setIntervals}
          onStartRun={() => setViewMode("runner")}
          onOpenPresets={() => setIsPresetsOpen(true)}
          onBackToOverview={() => setViewMode("overview")}
        />
      )}

      {viewMode === "runner" && (
        <OktRunner
          title={title}
          intervals={intervals}
          onBackToBuilder={() => setViewMode("builder")}
        />
      )}

      <OktPresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentIntervals={intervals}
        currentTitle={title}
        onLoadSession={(session) => {
          setTitle(session.title || "Ny økt");
          setIntervals(JSON.parse(JSON.stringify(session.intervals || [])));
        }}
      />
    </div>
  );
}
