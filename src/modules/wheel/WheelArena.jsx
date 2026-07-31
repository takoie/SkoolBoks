import { useState } from "react";
import WheelList from "./WheelList";
import WheelSpinner from "./WheelSpinner";

function WheelArena() {
  const [view, setView] = useState({ mode: "list" });

  if (view.mode === "spin") {
    return (
      <WheelSpinner
        wheelId={view.wheelId}
        onBack={() => setView({ mode: "list" })}
      />
    );
  }

  return <WheelList onOpen={(wheelId) => setView({ mode: "spin", wheelId })} />;
}

export default WheelArena;
